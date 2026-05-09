<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_only_sees_products_from_own_tenant(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
        ]);

        Product::factory()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Producto A',
        ]);

        Product::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Producto B',
        ]);

        $response = $this->actingAs($user)->getJson('/products');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'Producto A']);
        $response->assertJsonMissing(['name' => 'Producto B']);
    }

    public function test_cajero_cannot_create_products(): void
    {
        $user = User::factory()->forRoleSlug('cajero')->create();

        $response = $this->actingAs($user)->postJson('/products', [
            'sku' => 'SKU-101',
            'name' => 'Producto test',
            'price' => 100.50,
            'tax_rate' => 16,
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_create_product_and_tenant_is_assigned_automatically(): void
    {
        $tenant = Tenant::factory()->create();

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $response = $this->actingAs($user)->postJson('/products', [
            'sku' => 'SKU-200',
            'name' => 'Arroz 1kg',
            'price' => 33.90,
            'tax_rate' => 0,
            'unit' => 'pieza',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', [
            'tenant_id' => $tenant->id,
            'sku' => 'SKU-200',
            'name' => 'Arroz 1kg',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'event' => 'product.created',
            'entity_type' => Product::class,
        ]);

        $branchId = DB::table('audit_logs')
            ->where('event', 'product.created')
            ->where('user_id', $user->id)
            ->value('branch_id');

        $this->assertNotNull($branchId);
    }
}
