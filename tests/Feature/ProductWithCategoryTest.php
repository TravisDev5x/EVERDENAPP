<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductWithCategoryTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_create_product_with_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);
        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('products.store'), [
                'sku' => 'CAT-001',
                'name' => 'Producto categorizado',
                'price' => 50,
                'category_id' => $category->id,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', [
            'sku' => 'CAT-001',
            'category_id' => $category->id,
        ]);
    }

    #[Test]
    public function admin_can_create_product_without_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('products.store'), [
                'sku' => 'NOCAT-001',
                'name' => 'Sin categoría',
                'price' => 30,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', [
            'sku' => 'NOCAT-001',
            'category_id' => null,
        ]);
    }

    #[Test]
    public function product_cannot_be_assigned_category_of_another_tenant(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);
        $categoryB = ProductCategory::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->actingAs($userA)
            ->postJson(route('products.store'), [
                'sku' => 'HACK-001',
                'name' => 'Intento cross-tenant',
                'price' => 10,
                'category_id' => $categoryB->id,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['category_id']);

        $this->assertDatabaseMissing('products', [
            'sku' => 'HACK-001',
        ]);
    }

    #[Test]
    public function admin_can_update_product_to_assign_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => null,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson(route('products.update', $product), [
                'category_id' => $category->id,
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'category_id' => $category->id,
        ]);
    }

    #[Test]
    public function admin_can_remove_category_from_product(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson(route('products.update', $product), [
                'category_id' => null,
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'category_id' => null,
        ]);
    }
}
