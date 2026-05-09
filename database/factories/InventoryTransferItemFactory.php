<?php

namespace Database\Factories;

use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryTransferItem>
 */
class InventoryTransferItemFactory extends Factory
{
    protected $model = InventoryTransferItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tenant = Tenant::factory();

        return [
            'tenant_id' => $tenant,
            'inventory_transfer_id' => InventoryTransfer::factory()->for($tenant),
            'product_id' => Product::factory()->for($tenant),
            'quantity' => 1,
        ];
    }
}
