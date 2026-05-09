<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryIntelligenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_confirmation_creates_inventory_movement_and_alert_when_stock_low(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 25,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 11);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-alert-1',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => 'SALE_CONFIRM',
        ]);

        $this->assertDatabaseHas('inventory_alerts', [
            'product_id' => $product->id,
            'status' => 'open',
            'severity' => 'warning',
        ]);
    }

    public function test_alert_is_resolved_when_stock_is_above_threshold_again(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $this->seedBranchStock($product, $branch->id, 9);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();
        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();
        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-alert-2',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_alerts', [
            'product_id' => $product->id,
            'status' => 'open',
        ]);

        app(InventoryService::class)->applyStockDelta(
            product: $product->fresh(),
            branchId: (int) $user->branch_id,
            type: 'ADJUSTMENT',
            quantityDelta: 12,
            sourceType: 'manual-adjustment',
            sourceId: $product->id,
            metadata: ['reason' => 'restock test']
        );

        $this->assertDatabaseHas('inventory_alerts', [
            'product_id' => $product->id,
            'status' => 'resolved',
        ]);
    }
}
