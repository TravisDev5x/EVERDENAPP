<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class InventoryTransferPageTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_open_transfers_page(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->get(route('inventory.transfers.page'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Inventory/Transfers')
                ->has('transfers')
                ->has('branches')
                ->has('products')
                ->where('canManage', true)
        );
    }

    #[Test]
    public function page_shows_transfers_with_relations(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $branchA = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);
        $branchB = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);

        $product = Product::factory()->create(['tenant_id' => $tenant->id]);

        $transfer = InventoryTransfer::factory()->create([
            'tenant_id' => $tenant->id,
            'source_branch_id' => $branchA->id,
            'destination_branch_id' => $branchB->id,
            'user_id' => $admin->id,
            'status' => 'completed',
        ]);

        InventoryTransferItem::factory()->create([
            'tenant_id' => $tenant->id,
            'inventory_transfer_id' => $transfer->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $response = $this->actingAs($admin)
            ->get(route('inventory.transfers.page'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Inventory/Transfers')
                ->has('transfers', 1)
                ->where('transfers.0.id', $transfer->id)
                ->has('transfers.0.items', 1)
                ->where(
                    'transfers.0.source_branch.name',
                    $branchA->name
                )
                ->where(
                    'transfers.0.destination_branch.name',
                    $branchB->name
                )
        );
    }

    #[Test]
    public function tenant_a_does_not_see_transfers_of_tenant_b(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        $branchB1 = Branch::factory()->create(['tenant_id' => $tenantB->id]);
        $branchB2 = Branch::factory()->create(['tenant_id' => $tenantB->id]);
        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);

        InventoryTransfer::factory()->count(3)->create([
            'tenant_id' => $tenantB->id,
            'source_branch_id' => $branchB1->id,
            'destination_branch_id' => $branchB2->id,
            'user_id' => $userB->id,
        ]);

        $response = $this->actingAs($userA)
            ->get(route('inventory.transfers.page'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Inventory/Transfers')
                ->has('transfers', 0)
        );
    }

    #[Test]
    public function cajero_cannot_create_transfer_from_ui(): void
    {
        $cashier = User::factory()->forRoleSlug('cajero')->create();

        $response = $this->actingAs($cashier)
            ->get(route('inventory.transfers.page'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Inventory/Transfers')
                ->where('canManage', false)
        );
    }
}
