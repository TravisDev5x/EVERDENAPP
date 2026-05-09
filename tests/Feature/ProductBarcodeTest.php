<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductBarcodeTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_create_product_with_barcode(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('products.store'), [
                'sku' => 'INTERNAL-001',
                'barcode' => '7501234567890',
                'name' => 'Refresco 600ml',
                'price' => 18,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', [
            'sku' => 'INTERNAL-001',
            'barcode' => '7501234567890',
            'tenant_id' => $tenant->id,
        ]);
    }

    #[Test]
    public function admin_can_create_product_without_barcode(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('products.store'), [
                'sku' => 'NOBARCODE-001',
                'name' => 'Producto sin barcode',
                'price' => 10,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', [
            'sku' => 'NOBARCODE-001',
            'barcode' => null,
        ]);
    }

    #[Test]
    public function barcode_must_be_unique_per_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'A',
            'barcode' => '7501234567890',
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('products.store'), [
                'sku' => 'B',
                'barcode' => '7501234567890',
                'name' => 'Duplicado',
                'price' => 5,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['barcode']);
    }

    #[Test]
    public function barcode_can_repeat_across_tenants(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);

        Product::factory()->create([
            'tenant_id' => $tenantA->id,
            'sku' => 'A',
            'barcode' => '7501234567890',
        ]);

        $response = $this->actingAs($userB)
            ->postJson(route('products.store'), [
                'sku' => 'B',
                'barcode' => '7501234567890',
                'name' => 'Mismo barcode otro tenant',
                'price' => 5,
            ]);

        $response->assertCreated();
    }

    #[Test]
    public function pos_resolves_scan_by_barcode_first(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $cashier = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'ARZ-001',
            'barcode' => '7501234567890',
            'price' => 25,
            'is_active' => true,
        ]);

        $this->actingAs($cashier)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('sales.items.store', $sale->id), [
                'scan_code' => '7501234567890',
                'quantity' => 1,
            ])
            ->assertRedirect();

        $sale->refresh()->load('items');
        $this->assertCount(1, $sale->items);
        $this->assertEquals($product->id, $sale->items->first()->product_id);
    }

    #[Test]
    public function pos_falls_back_to_sku_when_no_barcode_match(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $cashier = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'LEGACY-SKU-001',
            'barcode' => null,
            'price' => 15,
            'is_active' => true,
        ]);

        $this->actingAs($cashier)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('sales.items.store', $sale->id), [
                'scan_code' => 'LEGACY-SKU-001',
                'quantity' => 1,
            ])
            ->assertRedirect();

        $sale->refresh()->load('items');
        $this->assertCount(1, $sale->items);
        $this->assertEquals($product->id, $sale->items->first()->product_id);
    }

    #[Test]
    public function pos_returns_validation_error_when_neither_barcode_nor_sku_match(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $cashier = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'EXISTS',
            'barcode' => '7501111111111',
            'is_active' => true,
        ]);

        $this->actingAs($cashier)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('sales.items.store', $sale->id), [
                'scan_code' => '7509999999999',
                'quantity' => 1,
            ])
            ->assertSessionHasErrors('scan_code');
    }
}
