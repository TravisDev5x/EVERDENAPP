<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddSaleItemRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\AuditLogger;
use App\Services\InventoryService;
use App\Services\SaleCalculator;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    private function ensureActiveBranchSale(Sale $sale): void
    {
        abort_unless((int) $sale->branch_id === (int) app('current_branch_id'), 403);
    }

    public function store(Request $request, AuditLogger $auditLogger): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $sale = Sale::create([
            'branch_id' => app('current_branch_id'),
            'user_id' => $request->user()->id,
            'status' => 'draft',
        ]);

        $auditLogger->log(
            event: 'sale.created',
            entityType: Sale::class,
            entityId: $sale->id,
            actor: $request->user(),
            metadata: [
                'status' => 'draft',
                'branch_id' => $sale->branch_id,
            ]
        );

        return to_route('sales.page', ['sale' => $sale->id]);
    }

    public function addItem(
        AddSaleItemRequest $request,
        Sale $sale,
        SaleCalculator $saleCalculator
    ): RedirectResponse {
        $this->ensureActiveBranchSale($sale);

        $product = Product::query()->findOrFail((int) $request->validated('product_id'));

        abort_unless((int) $product->tenant_id === (int) $request->user()->tenant_id, 403);

        $quantity = round((float) $request->validated('quantity'), 3);

        $existing = SaleItem::query()
            ->where('sale_id', $sale->id)
            ->where('product_id', $product->id)
            ->first();

        $finalQty = $quantity;
        if ($existing !== null) {
            $finalQty = round((float) $existing->quantity + $quantity, 3);
        }

        $quantityMilli = (int) round($finalQty * 1000);
        $unitPriceCents = Money::decimalToCents($product->price);
        $lineSubtotalCents = intdiv(($quantityMilli * $unitPriceCents) + 500, 1000);
        $lineTaxCents = Money::taxCents($lineSubtotalCents, $product->tax_rate);
        $lineTotalCents = $lineSubtotalCents + $lineTaxCents;

        $payload = [
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => $finalQty,
            'unit_price' => Money::centsToDecimal($unitPriceCents),
            'tax_rate' => $product->tax_rate,
            'line_subtotal' => Money::centsToDecimal($lineSubtotalCents),
            'line_tax_total' => Money::centsToDecimal($lineTaxCents),
            'line_total' => Money::centsToDecimal($lineTotalCents),
        ];

        if ($existing !== null) {
            $existing->update($payload);
        } else {
            SaleItem::create(array_merge($payload, [
                'sale_id' => $sale->id,
                'product_id' => $product->id,
            ]));
        }

        $saleCalculator->recalculate($sale);

        return back();
    }

    public function removeItem(
        Request $request,
        Sale $sale,
        SaleItem $item,
        SaleCalculator $saleCalculator
    ): RedirectResponse {
        $this->authorize('update', $sale);
        $this->ensureActiveBranchSale($sale);

        abort_unless($item->sale_id === $sale->id, 404);

        $item->delete();
        $saleCalculator->recalculate($sale);

        return back();
    }

    public function confirm(
        Request $request,
        Sale $sale,
        SaleCalculator $saleCalculator,
        AuditLogger $auditLogger,
        InventoryService $inventoryService
    ): RedirectResponse|JsonResponse {
        $idempotencyKey = (string) $request->input('idempotency_key', '');
        if ($idempotencyKey !== '') {
            $alreadyConfirmed = Sale::query()
                ->where('id', $sale->id)
                ->where('confirm_idempotency_key', $idempotencyKey)
                ->where('status', 'confirmed')
                ->exists();
            if ($alreadyConfirmed) {
                if ($request->expectsJson()) {
                    return response()->json($sale->fresh(['items']));
                }
                return back()->with('success', 'Confirmacion previa aplicada (idempotente).');
            }
        }

        $this->authorize('confirm', $sale);
        $this->ensureActiveBranchSale($sale);

        $idempotencyKey = (string) $request->validate([
            'idempotency_key' => ['required', 'string', 'max:120'],
        ])['idempotency_key'];

        $sale->load('items');

        if ($sale->items->isEmpty()) {
            return back()->withErrors([
                'sale' => 'No se puede confirmar una venta sin items.',
            ]);
        }

        $saleCalculator->recalculate($sale);

        $branchId = (int) app('current_branch_id');

        try {
            DB::transaction(function () use ($sale, $idempotencyKey, $inventoryService, $branchId): void {
                $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
                if ($sale->status === 'confirmed'
                    && $sale->confirm_idempotency_key === $idempotencyKey) {
                    return;
                }
                if ($sale->status !== 'draft') {
                    abort(409, 'La venta ya no esta en estado borrador.');
                }

                $sale->load(['items' => fn ($q) => $q->orderBy('product_id')]);

                foreach ($sale->items as $item) {
                    $product = Product::query()->findOrFail($item->product_id);

                    $inventoryService->applyStockDelta(
                        product: $product,
                        branchId: $branchId,
                        type: 'SALE_CONFIRM',
                        quantityDelta: -1 * (float) $item->quantity,
                        sourceType: Sale::class,
                        sourceId: $sale->id,
                        metadata: [
                            'sale_item_id' => $item->id,
                            'product_sku' => $item->product_sku,
                        ]
                    );
                }

                $sale->update([
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                    'confirm_idempotency_key' => $idempotencyKey,
                ]);
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        $sale->refresh();

        $auditLogger->log(
            event: 'sale.confirmed',
            entityType: Sale::class,
            entityId: $sale->id,
            actor: $request->user(),
            metadata: [
                'subtotal' => $sale->subtotal,
                'tax_total' => $sale->tax_total,
                'total' => $sale->total,
                'idempotency_key' => $idempotencyKey,
            ]
        );

        if ($request->expectsJson()) {
            return response()->json($sale->fresh(['items']));
        }

        return to_route('sales.page', ['sale' => $sale->id])
            ->with('success', 'Venta confirmada correctamente.');
    }
}
