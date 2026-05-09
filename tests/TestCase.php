<?php

namespace Tests;

use App\Models\BranchProductStock;
use App\Models\Product;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    protected function seedBranchStock(Product $product, int $branchId, float $quantity): BranchProductStock
    {
        return BranchProductStock::query()->updateOrCreate(
            [
                'branch_id' => $branchId,
                'product_id' => $product->id,
            ],
            [
                'tenant_id' => $product->tenant_id,
                'quantity' => round($quantity, 3),
            ]
        );
    }
}
