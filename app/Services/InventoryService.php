<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchProductStock;
use App\Models\InventoryAlert;
use App\Models\InventoryMovement;
use App\Models\InventoryPolicy;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Aplica un delta de cantidad (ventas, devoluciones futuras, etc.).
     *
     * @param  array<string, mixed>  $metadata
     *
     * @throws ValidationException Si el saldo quedaría negativo.
     */
    public function applyStockDelta(
        Product $product,
        int $branchId,
        string $type,
        float $quantityDelta,
        ?string $sourceType = null,
        ?int $sourceId = null,
        array $metadata = []
    ): InventoryMovement {
        return DB::transaction(function () use (
            $product,
            $branchId,
            $type,
            $quantityDelta,
            $sourceType,
            $sourceId,
            $metadata
        ): InventoryMovement {
            $this->assertBranchBelongsToProductTenant($branchId, $product);

            $stock = $this->lockStockRow((int) $product->tenant_id, $branchId, (int) $product->id);

            $previous = round((float) $stock->quantity, 3);
            $delta = round($quantityDelta, 3);
            $next = round($previous + $delta, 3);

            if ($next < 0) {
                throw ValidationException::withMessages([
                    'sale' => "Inventario insuficiente para {$product->name}.",
                ]);
            }

            $stock->update(['quantity' => $next]);

            return $this->createMovementAndEvaluateAlerts(
                $product,
                $branchId,
                $type,
                $delta,
                $next,
                $sourceType,
                $sourceId,
                $metadata
            );
        });
    }

    /**
     * Fija el saldo absoluto en sucursal y registra un movimiento ADJUSTMENT con el delta real.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function adjustStockToTarget(
        Product $product,
        int $branchId,
        float $targetQuantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        array $metadata = []
    ): InventoryMovement {
        return DB::transaction(function () use (
            $product,
            $branchId,
            $targetQuantity,
            $sourceType,
            $sourceId,
            $metadata
        ): InventoryMovement {
            $this->assertBranchBelongsToProductTenant($branchId, $product);

            $stock = $this->lockStockRow((int) $product->tenant_id, $branchId, (int) $product->id);

            $previous = round((float) $stock->quantity, 3);
            $target = round($targetQuantity, 3);
            if ($target < 0) {
                throw ValidationException::withMessages([
                    'new_quantity' => 'La cantidad no puede ser negativa.',
                ]);
            }

            $delta = round($target - $previous, 3);
            $stock->update(['quantity' => $target]);

            return $this->createMovementAndEvaluateAlerts(
                $product,
                $branchId,
                'ADJUSTMENT',
                $delta,
                $target,
                $sourceType,
                $sourceId,
                array_merge($metadata, [
                    'previous_quantity' => $previous,
                    'new_quantity' => $target,
                ])
            );
        });
    }

    private function assertBranchBelongsToProductTenant(int $branchId, Product $product): void
    {
        $branchTenantId = (int) Branch::query()->whereKey($branchId)->value('tenant_id');
        abort_unless($branchTenantId === (int) $product->tenant_id, 403);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function createMovementAndEvaluateAlerts(
        Product $product,
        int $branchId,
        string $type,
        float $quantityDelta,
        float $balanceAfter,
        ?string $sourceType,
        ?int $sourceId,
        array $metadata
    ): InventoryMovement {
        $movement = InventoryMovement::query()->create([
            'tenant_id' => $product->tenant_id,
            'branch_id' => $branchId,
            'product_id' => $product->id,
            'type' => $type,
            'quantity_delta' => $quantityDelta,
            'balance_after' => $balanceAfter,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'metadata' => $metadata,
        ]);

        $this->evaluateAlerts($product, $branchId, $balanceAfter, $movement->id);

        return $movement;
    }

    private function lockStockRow(int $tenantId, int $branchId, int $productId): BranchProductStock
    {
        $stock = BranchProductStock::query()
            ->where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();

        if ($stock !== null) {
            return $stock;
        }

        BranchProductStock::query()->create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'product_id' => $productId,
            'quantity' => 0,
        ]);

        return BranchProductStock::query()
            ->where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function evaluateAlerts(Product $product, int $branchId, float $currentStock, int $movementId): void
    {
        $policy = InventoryPolicy::query()->firstOrCreate(
            [
                'tenant_id' => $product->tenant_id,
                'branch_id' => $branchId,
                'product_id' => $product->id,
            ],
            [
                'min_threshold' => 10,
                'is_alert_enabled' => true,
                'cooldown_minutes' => 60,
            ]
        );

        if (! $policy->is_alert_enabled) {
            return;
        }

        $threshold = (float) $policy->min_threshold;
        $severity = $currentStock <= 0 ? 'critical' : 'warning';
        $dedupeKey = "{$branchId}:{$product->id}:{$severity}";

        if ($currentStock <= $threshold) {
            $openAlert = InventoryAlert::query()
                ->where('branch_id', $branchId)
                ->where('product_id', $product->id)
                ->where('status', 'open')
                ->where('dedupe_key', $dedupeKey)
                ->first();

            if (! $openAlert) {
                InventoryAlert::query()->create([
                    'tenant_id' => $product->tenant_id,
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                    'inventory_policy_id' => $policy->id,
                    'severity' => $severity,
                    'status' => 'open',
                    'current_stock' => $currentStock,
                    'threshold' => $threshold,
                    'dedupe_key' => $dedupeKey,
                    'triggered_at' => now(),
                    'metadata' => [
                        'movement_id' => $movementId,
                        'policy_threshold' => $threshold,
                    ],
                ]);
            }

            return;
        }

        InventoryAlert::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $product->id)
            ->where('status', 'open')
            ->update([
                'status' => 'resolved',
                'resolved_at' => now(),
            ]);
    }
}
