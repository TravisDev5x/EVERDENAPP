<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductCategoryTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function category_belongs_to_tenant_automatically(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user);

        app()->instance('current_tenant_id', $user->tenant_id);

        $category = ProductCategory::create([
            'name' => 'Abarrotes',
            'slug' => 'abarrotes',
        ]);

        $this->assertEquals($tenant->id, $category->tenant_id);
    }

    #[Test]
    public function category_a_is_invisible_to_tenant_b(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        ProductCategory::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Categoría B',
        ]);

        $this->actingAs($userA);

        app()->instance('current_tenant_id', $userA->tenant_id);

        $count = ProductCategory::count();
        $this->assertEquals(0, $count);
    }

    #[Test]
    public function product_can_have_a_category(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user);

        app()->instance('current_tenant_id', $user->tenant_id);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
        ]);

        $this->assertEquals($category->id, $product->category_id);
        $this->assertEquals($category->name, $product->category->name);
    }

    #[Test]
    public function product_can_have_no_category(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user);

        app()->instance('current_tenant_id', $user->tenant_id);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => null,
        ]);

        $this->assertNull($product->category_id);
        $this->assertNull($product->category);
    }

    #[Test]
    public function deleting_category_sets_null_on_products(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user);

        app()->instance('current_tenant_id', $user->tenant_id);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
        ]);

        $category->delete();

        $product->refresh();
        $this->assertNull($product->category_id);
    }
}
