<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchProductStock;
use App\Models\InventoryMovement;
use App\Models\InventoryTransfer;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class InventoryTransferTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_transfer_stock_between_branches(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $branchA = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $branchB = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);

        $product = Product::factory()->create(['tenant_id' => $tenant->id]);

        BranchProductStock::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branchA->id,
            'product_id' => $product->id,
            'quantity' => 50,
        ]);
        BranchProductStock::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branchB->id,
            'product_id' => $product->id,
            'quantity' => 0,
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branchA->id,
                'destination_branch_id' => $branchB->id,
                'reference' => 'REM-001',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 15],
                ],
            ]);

        $response->assertCreated();

        $stockA = BranchProductStock::query()
            ->where('branch_id', $branchA->id)
            ->where('product_id', $product->id)
            ->value('quantity');
        $this->assertSame('35.000', number_format((float) $stockA, 3, '.', ''));

        $stockB = BranchProductStock::query()
            ->where('branch_id', $branchB->id)
            ->where('product_id', $product->id)
            ->value('quantity');
        $this->assertSame('15.000', number_format((float) $stockB, 3, '.', ''));

        $this->assertEquals(2, InventoryMovement::count());
        $this->assertEquals(1, InventoryMovement::where('type', 'TRANSFER_OUT')->count());
        $this->assertEquals(1, InventoryMovement::where('type', 'TRANSFER_IN')->count());

        $transfer = InventoryTransfer::firstOrFail();
        $this->assertEquals(2, InventoryMovement::where('source_id', $transfer->id)->count());
    }

    #[Test]
    public function transfer_fails_when_source_has_insufficient_stock(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $branchA = Branch::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
        $branchB = Branch::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);

        $product = Product::factory()->create(['tenant_id' => $tenant->id]);

        BranchProductStock::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branchA->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branchA->id,
                'destination_branch_id' => $branchB->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 100],
                ],
            ]);

        $response->assertUnprocessable();

        $this->assertSame(
            '5.000',
            number_format(
                (float) BranchProductStock::query()
                    ->where('branch_id', $branchA->id)
                    ->where('product_id', $product->id)
                    ->value('quantity'),
                3,
                '.',
                ''
            )
        );

        $this->assertEquals(0, InventoryTransfer::count());
    }

    #[Test]
    public function transfer_rejects_same_source_and_destination(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);
        $branch = Branch::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
        $product = Product::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($admin)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branch->id,
                'destination_branch_id' => $branch->id,
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['destination_branch_id']);
    }

    #[Test]
    public function tenant_a_cannot_transfer_to_branch_of_tenant_b(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);

        $branchA = Branch::factory()->create(['tenant_id' => $tenantA->id, 'is_active' => true]);
        $branchB = Branch::factory()->create(['tenant_id' => $tenantB->id, 'is_active' => true]);

        $productA = Product::factory()->create(['tenant_id' => $tenantA->id]);

        $response = $this->actingAs($userA)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branchA->id,
                'destination_branch_id' => $branchB->id,
                'items' => [['product_id' => $productA->id, 'quantity' => 1]],
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['destination_branch_id']);
    }

    #[Test]
    public function cajero_cannot_create_transfer(): void
    {
        $cashier = User::factory()->forRoleSlug('cajero')->create();

        $branchA = Branch::factory()->create(['tenant_id' => $cashier->tenant_id, 'is_active' => true]);
        $branchB = Branch::factory()->create(['tenant_id' => $cashier->tenant_id, 'is_active' => true]);
        $product = Product::factory()->create(['tenant_id' => $cashier->tenant_id]);

        $response = $this->actingAs($cashier)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branchA->id,
                'destination_branch_id' => $branchB->id,
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ]);

        $response->assertForbidden();
    }

    #[Test]
    public function transfer_rejects_duplicate_product_in_items(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $branchA = Branch::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
        $branchB = Branch::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);

        $product = Product::factory()->create(['tenant_id' => $tenant->id]);

        BranchProductStock::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branchA->id,
            'product_id' => $product->id,
            'quantity' => 100,
        ]);

        $response = $this->actingAs($admin)
            ->postJson(route('inventory.transfers.store'), [
                'source_branch_id' => $branchA->id,
                'destination_branch_id' => $branchB->id,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 5],
                    ['product_id' => $product->id, 'quantity' => 3],
                ],
            ]);

        $response->assertUnprocessable();
        $this->assertEquals(0, InventoryTransfer::count());
    }
}
