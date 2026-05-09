<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductCategoryPageTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_open_category_management_page(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        ProductCategory::factory()->count(2)->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->get(route('product-categories.page'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('ProductCategories/Index')
            ->has('categories', 2)
            ->where('canManage', true)
        );
    }

    #[Test]
    public function page_shows_product_count_per_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);
        Product::factory()->count(3)->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($admin)
            ->get(route('product-categories.page'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('ProductCategories/Index')
            ->where('categories.0.products_count', 3)
        );
    }

    #[Test]
    public function tenant_a_does_not_see_categories_of_tenant_b_in_page(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        ProductCategory::factory()->count(3)->create(['tenant_id' => $tenantB->id]);
        ProductCategory::factory()->count(1)->create(['tenant_id' => $tenantA->id]);

        $response = $this->actingAs($userA)
            ->get(route('product-categories.page'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('ProductCategories/Index')
            ->has('categories', 1)
        );
    }
}
