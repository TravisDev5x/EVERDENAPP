<?php

namespace Tests\Feature;

use App\Models\ProductCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductCategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_list_categories_of_own_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        ProductCategory::factory()->count(3)->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->getJson(route('product-categories.index'));

        $response->assertOk();
        $response->assertJsonCount(3);
    }

    #[Test]
    public function admin_can_create_category_with_tenant_assigned_automatically(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('product-categories.store'), [
                'name' => 'Bebidas',
                'slug' => 'bebidas',
                'color' => '#185FA5',
                'sort_order' => 10,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('product_categories', [
            'tenant_id' => $tenant->id,
            'name' => 'Bebidas',
            'slug' => 'bebidas',
        ]);
    }

    #[Test]
    public function cajero_cannot_create_category(): void
    {
        $user = User::factory()->forRoleSlug('cajero')->create();

        $response = $this->actingAs($user)
            ->postJson(route('product-categories.store'), [
                'name' => 'Test',
                'slug' => 'test',
            ]);

        $response->assertForbidden();
    }

    #[Test]
    public function admin_can_update_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $category = ProductCategory::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Original',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson(route('product-categories.update', $category), [
                'name' => 'Renombrada',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('product_categories', [
            'id' => $category->id,
            'name' => 'Renombrada',
        ]);
    }

    #[Test]
    public function admin_can_delete_category(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $category = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->deleteJson(route('product-categories.destroy', $category));

        $response->assertOk();
        $this->assertDatabaseMissing('product_categories', [
            'id' => $category->id,
        ]);
    }

    #[Test]
    public function tenant_a_cannot_update_category_of_tenant_b(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        $categoryB = ProductCategory::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Categoría B',
        ]);

        $response = $this->actingAs($userA)
            ->patchJson(route('product-categories.update', $categoryB), [
                'name' => 'Hackeada',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('product_categories', [
            'id' => $categoryB->id,
            'name' => 'Categoría B',
        ]);
    }

    #[Test]
    public function tenant_a_cannot_delete_category_of_tenant_b(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        $categoryB = ProductCategory::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->actingAs($userA)
            ->deleteJson(route('product-categories.destroy', $categoryB));

        $response->assertForbidden();

        $this->assertDatabaseHas('product_categories', [
            'id' => $categoryB->id,
        ]);
    }

    #[Test]
    public function slug_must_be_unique_per_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        ProductCategory::factory()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'bebidas',
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('product-categories.store'), [
                'name' => 'Otra',
                'slug' => 'bebidas',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['slug']);
    }

    #[Test]
    public function slug_can_repeat_across_tenants(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);

        ProductCategory::factory()->create([
            'tenant_id' => $tenantA->id,
            'slug' => 'bebidas',
        ]);

        $response = $this->actingAs($userB)
            ->postJson(route('product-categories.store'), [
                'name' => 'Bebidas B',
                'slug' => 'bebidas',
            ]);

        $response->assertCreated();
    }
}
