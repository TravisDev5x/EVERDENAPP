<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryTransferService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    /**
     * Crea y ejecuta una transferencia de stock entre sucursales del mismo tenant.
     *
     * @param  array<int, array{product_id:int, quantity:float}>  $items
     */
    public function execute(
        User $actor,
        int $sourceBranchId,
        int $destinationBranchId,
        array $items,
        ?string $reference = null,
        ?string $reason = null,
    ): InventoryTransfer {
        $this->validateBranches($actor, $sourceBranchId, $destinationBranchId);
        $this->validateItems($items);

        return DB::transaction(function () use (
            $actor,
            $sourceBranchId,
            $destinationBranchId,
            $items,
            $reference,
            $reason,
        ): InventoryTransfer {
            $transfer = InventoryTransfer::create([
                'tenant_id' => $actor->tenant_id,
                'source_branch_id' => $sourceBranchId,
                'destination_branch_id' => $destinationBranchId,
                'user_id' => $actor->id,
                'reference' => $reference,
                'status' => 'completed',
                'reason' => $reason,
                'completed_at' => now(),
            ]);

            foreach ($items as $row) {
                $product = Product::query()->findOrFail($row['product_id']);

                if ((int) $product->tenant_id !== (int) $actor->tenant_id) {
                    abort(403, 'Producto fuera del tenant.');
                }

                $quantity = round((float) $row['quantity'], 3);

                if ($quantity <= 0) {
                    throw ValidationException::withMessages([
                        'items' => 'Cantidad debe ser mayor a cero.',
                    ]);
                }

                $item = InventoryTransferItem::create([
                    'tenant_id' => $actor->tenant_id,
                    'inventory_transfer_id' => $transfer->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                ]);

                $this->inventoryService->applyStockDelta(
                    product: $product,
                    branchId: $sourceBranchId,
                    type: 'TRANSFER_OUT',
                    quantityDelta: -1 * $quantity,
                    sourceType: InventoryTransfer::class,
                    sourceId: $transfer->id,
                    metadata: [
                        'transfer_item_id' => $item->id,
                        'destination_branch_id' => $destinationBranchId,
                    ],
                );

                $this->inventoryService->applyStockDelta(
                    product: $product,
                    branchId: $destinationBranchId,
                    type: 'TRANSFER_IN',
                    quantityDelta: $quantity,
                    sourceType: InventoryTransfer::class,
                    sourceId: $transfer->id,
                    metadata: [
                        'transfer_item_id' => $item->id,
                        'source_branch_id' => $sourceBranchId,
                    ],
                );
            }

            return $transfer->fresh(['items']);
        });
    }

    private function validateBranches(User $actor, int $sourceBranchId, int $destinationBranchId): void
    {
        if ($sourceBranchId === $destinationBranchId) {
            throw ValidationException::withMessages([
                'destination_branch_id' => 'La sucursal destino debe ser diferente a la origen.',
            ]);
        }

        $source = Branch::withoutGlobalScope('tenant')->find($sourceBranchId);
        $destination = Branch::withoutGlobalScope('tenant')->find($destinationBranchId);

        if (! $source || (int) $source->tenant_id !== (int) $actor->tenant_id) {
            abort(403, 'Sucursal origen fuera del tenant.');
        }

        if (! $destination || (int) $destination->tenant_id !== (int) $actor->tenant_id) {
            abort(403, 'Sucursal destino fuera del tenant.');
        }

        if (! $source->is_active || ! $destination->is_active) {
            throw ValidationException::withMessages([
                'destination_branch_id' => 'Ambas sucursales deben estar activas.',
            ]);
        }
    }

    /**
     * @param  array<int, array{product_id:int, quantity:float}>  $items
     */
    private function validateItems(array $items): void
    {
        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => 'Debe incluir al menos un producto.',
            ]);
        }

        $seen = [];
        foreach ($items as $row) {
            $pid = (int) ($row['product_id'] ?? 0);
            if ($pid <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'product_id inválido.',
                ]);
            }
            if (isset($seen[$pid])) {
                throw ValidationException::withMessages([
                    'items' => 'No se puede repetir el mismo producto en una transferencia.',
                ]);
            }
            $seen[$pid] = true;
        }
    }
}
