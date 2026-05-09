<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Ejecuta el mismo flujo que ventas en HTTP: borrador → líneas → confirmar (inventario) → cobro (caja + finanzas).
 * Para uso en seeds y pruebas de integración; requiere {@see TenantContext} y bindings `current_*` coherentes.
 */
final class StressSaleFlowService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly SaleCalculator $saleCalculator,
        private readonly InventoryService $inventoryService,
        private readonly AuditLogger $auditLogger,
        private readonly CashSessionService $cashSessionService,
        private readonly FinanceService $financeService,
    ) {}

    /**
     * @param  array<int, Product>  $products
     *
     * @throws ValidationException
     */
    public function runCompleteSale(
        User $actor,
        Tenant $tenant,
        Branch $branch,
        array $products,
        int $minLines,
        int $maxLines,
        ?Carbon $at = null,
        float $openingAmount = 500.0,
    ): Sale {
        if ($products === []) {
            throw new \InvalidArgumentException('StressSaleFlowService: se requiere al menos un producto.');
        }

        $at ??= Carbon::now();

        try {
            Carbon::setTestNow($at);

            $this->bindContext((int) $tenant->id, (int) $branch->id);

            $cashSession = $this->ensureOpenCashSession($actor, $branch, $openingAmount);

            $sale = Sale::query()->create([
                'branch_id' => $branch->id,
                'user_id' => $actor->id,
                'status' => 'draft',
            ]);

            $this->auditLogger->log(
                event: 'sale.created',
                entityType: Sale::class,
                entityId: $sale->id,
                actor: $actor,
                metadata: [
                    'status' => 'draft',
                    'branch_id' => $branch->id,
                    'seed' => 'stress_real_flow',
                ]
            );

            $lines = fake()->numberBetween($minLines, $maxLines);
            for ($i = 0; $i < $lines; $i++) {
                $product = $products[array_rand($products)];
                $quantity = round(fake()->randomFloat(3, 1, min(12, 50)), 3);

                $quantityMilli = (int) round($quantity * 1000);
                $unitPriceCents = Money::decimalToCents($product->price);
                $lineSubtotalCents = intdiv(($quantityMilli * $unitPriceCents) + 500, 1000);
                $lineTaxCents = Money::taxCents($lineSubtotalCents, $product->tax_rate);
                $lineTotalCents = $lineSubtotalCents + $lineTaxCents;

                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => Money::centsToDecimal($unitPriceCents),
                    'tax_rate' => $product->tax_rate,
                    'line_subtotal' => Money::centsToDecimal($lineSubtotalCents),
                    'line_tax_total' => Money::centsToDecimal($lineTaxCents),
                    'line_total' => Money::centsToDecimal($lineTotalCents),
                ]);
            }

            $sale = $this->saleCalculator->recalculate($sale->fresh(['items']));

            $confirmKey = 'stress-confirm-'.Str::uuid()->toString();
            $this->confirmSaleLikeController($sale, $confirmKey);

            $sale->refresh();

            $this->auditLogger->log(
                event: 'sale.confirmed',
                entityType: Sale::class,
                entityId: $sale->id,
                actor: $actor,
                metadata: [
                    'subtotal' => $sale->subtotal,
                    'tax_total' => $sale->tax_total,
                    'total' => $sale->total,
                    'idempotency_key' => $confirmKey,
                    'seed' => 'stress_real_flow',
                ]
            );

            $paymentKey = 'stress-pay-'.Str::uuid()->toString();
            $this->payCashLikeController($sale->fresh(), $actor, $cashSession, $paymentKey);

            $this->auditLogger->log(
                event: 'payment.cash.applied',
                entityType: Sale::class,
                entityId: $sale->id,
                actor: $actor,
                metadata: [
                    'amount' => $sale->fresh()->total,
                    'cash_session_id' => $cashSession->id,
                    'branch_id' => $branch->id,
                    'idempotency_key' => $paymentKey,
                    'seed' => 'stress_real_flow',
                ]
            );

            return $sale->fresh(['items', 'payments']);
        } finally {
            Carbon::setTestNow();
            $this->releaseContextBindings();
        }
    }

    private function bindContext(int $tenantId, int $branchId): void
    {
        app()->instance('current_tenant_id', $tenantId);
        app()->instance('current_branch_id', $branchId);
        $this->tenantContext->set($tenantId, $branchId);
    }

    private function releaseContextBindings(): void
    {
        if (app()->bound('current_tenant_id')) {
            app()->forgetInstance('current_tenant_id');
        }
        if (app()->bound('current_branch_id')) {
            app()->forgetInstance('current_branch_id');
        }
        $this->tenantContext->clear();
    }

    private function ensureOpenCashSession(User $user, Branch $branch, float $openingAmount): CashSession
    {
        $existing = $this->cashSessionService->currentOpenFor($user, (int) $branch->id);
        if ($existing instanceof CashSession) {
            return $existing;
        }

        $register = CashRegister::query()
            ->where('branch_id', $branch->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->firstOrFail();

        $session = $this->cashSessionService->openFor($user, $branch, $register, $openingAmount);
        $this->financeService->recordCashOpen($session, $user);

        return $session->fresh();
    }

    private function confirmSaleLikeController(Sale $sale, string $idempotencyKey): void
    {
        $branchId = (int) app('current_branch_id');

        DB::transaction(function () use ($sale, $idempotencyKey, $branchId): void {
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

                $this->inventoryService->applyStockDelta(
                    product: $product,
                    branchId: $branchId,
                    type: 'SALE_CONFIRM',
                    quantityDelta: -1 * (float) $item->quantity,
                    sourceType: Sale::class,
                    sourceId: $sale->id,
                    metadata: [
                        'sale_item_id' => $item->id,
                        'product_sku' => $item->product_sku,
                        'seed' => 'stress_real_flow',
                    ]
                );
            }

            $sale->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'confirm_idempotency_key' => $idempotencyKey,
            ]);
        });
    }

    private function payCashLikeController(Sale $sale, User $actor, CashSession $cashSession, string $idempotencyKey): void
    {
        $branchId = (int) app('current_branch_id');
        $amountCents = Money::decimalToCents((string) $sale->total);

        DB::transaction(function () use (
            $sale,
            $cashSession,
            $actor,
            $branchId,
            $idempotencyKey,
            $amountCents,
        ): void {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
            if ($sale->payment_status === 'paid') {
                return;
            }
            $cashSession = $cashSession->newQuery()->lockForUpdate()->findOrFail($cashSession->id);

            $payment = Payment::query()->create([
                'branch_id' => $branchId,
                'sale_id' => $sale->id,
                'cash_session_id' => $cashSession->id,
                'user_id' => $actor->id,
                'method' => 'cash',
                'idempotency_key' => $idempotencyKey,
                'amount' => Money::centsToDecimal($amountCents),
                'status' => 'applied',
                'paid_at' => now(),
            ]);

            $currentCashCents = Money::decimalToCents((string) $cashSession->cash_sales_total);
            $cashSession->update([
                'cash_sales_total' => Money::centsToDecimal($currentCashCents + $amountCents),
            ]);

            $sale->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
            ]);

            $this->financeService->recordCashPayment($sale, $payment, $actor);
        });
    }
}
