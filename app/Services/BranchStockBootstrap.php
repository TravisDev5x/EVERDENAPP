<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchProductStock;
use App\Models\Product;

/**
 * Garantiza una fila de saldo por (sucursal × producto) para lecturas rápidas coherentes con el ledger.
 */
final class BranchStockBootstrap
{
    public function ensureStocksForProduct(Product $product): void
    {
        $branches = Branch::query()
            ->where('tenant_id', $product->tenant_id)
            ->pluck('id');

        foreach ($branches as $branchId) {
            BranchProductStock::query()->firstOrCreate(
                [
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                ],
                [
                    'tenant_id' => $product->tenant_id,
                    'quantity' => 0,
                ]
            );
        }
    }

    public function ensureStocksForBranch(Branch $branch): void
    {
        $productIds = Product::query()
            ->where('tenant_id', $branch->tenant_id)
            ->pluck('id');

        foreach ($productIds as $productId) {
            BranchProductStock::query()->firstOrCreate(
                [
                    'branch_id' => $branch->id,
                    'product_id' => $productId,
                ],
                [
                    'tenant_id' => $branch->tenant_id,
                    'quantity' => 0,
                ]
            );
        }
    }
}
