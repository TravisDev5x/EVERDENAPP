<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\InventoryAlert;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryFrontendFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_page_renders_for_authenticated_user(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $branch = Branch::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sucursal Matriz',
            'is_main' => true,
            'is_active' => true,
        ]);
        $user->forceFill(['branch_id' => $branch->id])->save();

        $this->actingAs($user)->get(route('inventory.page'))->assertOk();
    }

    public function test_admin_can_adjust_stock_and_create_movement(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $branch = Branch::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sucursal Matriz',
            'is_main' => true,
            'is_active' => true,
        ]);
        $user->forceFill(['branch_id' => $branch->id])->save();

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $this->seedBranchStock($product, $branch->id, 50);

        $this->actingAs($user)->post(route('inventory.adjust', $product->id), [
            'new_quantity' => 30,
            'reason' => 'Ajuste por conteo ciclico',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => 'ADJUSTMENT',
        ]);
    }

    public function test_admin_can_acknowledge_inventory_alert(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $branch = Branch::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sucursal Matriz',
            'is_main' => true,
            'is_active' => true,
        ]);
        $user->forceFill(['branch_id' => $branch->id])->save();

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $this->seedBranchStock($product, $branch->id, 5);

        $alert = InventoryAlert::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'product_id' => $product->id,
            'severity' => 'warning',
            'status' => 'open',
            'current_stock' => 5,
            'threshold' => 10,
            'dedupe_key' => "{$branch->id}:{$product->id}:warning",
            'triggered_at' => now(),
        ]);

        $this->actingAs($user)->post(route('inventory.alerts.ack', $alert->id))
            ->assertRedirect();

        $this->assertDatabaseHas('inventory_alerts', [
            'id' => $alert->id,
            'status' => 'acknowledged',
        ]);
    }
}
