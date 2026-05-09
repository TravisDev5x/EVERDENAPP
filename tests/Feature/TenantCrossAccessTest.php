<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TenantCrossAccessTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function tenant_a_cannot_mutate_product_of_tenant_b_via_id_injection(): void
    {
        [$userA, $productB] = $this->setupTwoTenants();

        $this->actingAs($userA)
            ->patchJson(route('products.update', $productB), [
                'name'  => 'Hacked name',
                'price' => 1,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('products', [
            'id'   => $productB->id,
            'name' => $productB->name,
        ]);
    }

    #[Test]
    public function tenant_a_cannot_add_sale_item_with_product_of_tenant_b(): void
    {
        [$userA, $productB] = $this->setupTwoTenants();

        $userB = User::factory()->create([
            'tenant_id' => $productB->tenant_id,
        ]);

        $saleA = Sale::query()->create([
            'tenant_id' => $userA->tenant_id,
            'user_id'   => $userA->id,
            'status'    => 'draft',
        ]);

        $this->actingAs($userA)
            ->post(route('sales.items.store', $saleA->id), [
                'product_id' => $productB->id, // ID del tenant B inyectado
                'quantity'   => 1,
            ])
            ->assertSessionHasErrors('product_id');
    }

    #[Test]
    public function tenant_a_products_are_invisible_to_tenant_b_queries(): void
    {
        [$userA, $productB] = $this->setupTwoTenants();

        $this->actingAs($userA)
            ->getJson(route('products.index'))
            ->assertOk()
            ->assertJsonMissing(['id'   => $productB->id])
            ->assertJsonMissing(['name' => $productB->name]);
    }

    /** @return array{User, Product} */
    private function setupTwoTenants(): array
    {
        $tenantA = Tenant::factory()->create(['is_active' => true]);
        $tenantB = Tenant::factory()->create(['is_active' => true]);

        $userA = User::factory()->create([
            'tenant_id' => $tenantA->id,
        ]);

        $productB = Product::factory()->create([
            'tenant_id' => $tenantB->id,
            'name'      => 'Producto del Tenant B',
            'price'     => 100,
        ]);

        return [$userA, $productB];
    }
}