<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchProductStock;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Jobs\ProcessSalePrintJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SalesFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_add_item_accepts_scan_code_and_merges_same_product_line(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'SKU-BAR-001',
            'price' => 10.00,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 50);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'scan_code' => 'SKU-BAR-001',
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'scan_code' => 'sku-bar-001',
            'quantity' => 2,
        ])->assertRedirect();

        $sale->refresh()->load('items');
        $this->assertCount(1, $sale->items);
        $this->assertSame('3.000', number_format((float) $sale->items->first()->quantity, 3, '.', ''));
        $this->assertSame('30.00', number_format((float) $sale->total, 2, '.', ''));
    }

    public function test_scan_code_unknown_returns_validation_error(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        Product::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)
            ->post(route('sales.items.store', $sale->id), [
                'scan_code' => 'NO-EXISTE',
                'quantity' => 1,
            ])
            ->assertSessionHasErrors('scan_code');
    }

    public function test_add_item_accepts_qr_url_with_sku_query_string(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'QR-PROD-URL',
            'price' => 5.00,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 10);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'scan_code' => 'https://demo.test/catalogo?utm=1&sku=QR-PROD-URL',
            'quantity' => 1,
        ])->assertRedirect();

        $sale->refresh();
        $this->assertSame('5.00', number_format((float) $sale->total, 2, '.', ''));
    }

    public function test_display_state_returns_json_for_poll(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)
            ->getJson(route('sales.display-state', $sale->id))
            ->assertOk()
            ->assertJsonStructure(['sale' => ['id', 'total', 'items'], 'polled_at']);
    }

    public function test_enqueue_print_dispatches_job_and_inserts_row(): void
    {
        Queue::fake();

        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.print-queue', $sale->id))->assertRedirect();

        $this->assertDatabaseHas('print_jobs', [
            'sale_id' => $sale->id,
            'tenant_id' => $tenant->id,
            'status' => 'pending',
        ]);

        Queue::assertPushed(ProcessSalePrintJob::class);
    }

    public function test_customer_display_page_loads_for_same_branch_sale(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)
            ->get(route('sales.customer-display', $sale->id))
            ->assertOk();
    }

    public function test_cajero_can_create_add_item_and_confirm_sale(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 10.00,
            'tax_rate' => 16.00,
        ]);
        $this->seedBranchStock($product, $branch->id, 100);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $user->refresh();

        $sale = Sale::query()->firstOrFail();
        $this->assertSame('draft', $sale->status);
        $this->assertSame($user->branch_id, $sale->branch_id);

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertRedirect();

        $sale->refresh();
        $this->assertSame('23.20', number_format((float) $sale->total, 2, '.', ''));

        $this->actingAs($user)
            ->postJson(route('sales.confirm', $sale->id), [
                'idempotency_key' => 'sale-confirm-1',
            ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'confirmed']);

        $qty = BranchProductStock::query()
            ->where('branch_id', $branch->id)
            ->where('product_id', $product->id)
            ->value('quantity');

        $this->assertSame('98.000', number_format((float) $qty, 3, '.', ''));
    }

    public function test_confirmed_sale_is_immutable_for_new_items(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $sale = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_tenant_cannot_add_item_to_other_tenant_sale(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenantA->id,
        ]);

        $saleB = Sale::query()->create([
            'tenant_id' => $tenantB->id,
            'user_id' => User::factory()->forRoleSlug('cajero')->create([
                'tenant_id' => $tenantB->id,
            ])->id,
            'status' => 'draft',
        ]);

        $productA = Product::factory()->create([
            'tenant_id' => $tenantA->id,
        ]);

        $this->actingAs($userA)->post(route('sales.items.store', $saleB->id), [
            'product_id' => $productA->id,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_sale_cannot_be_confirmed_without_inventory(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $this->seedBranchStock($product, $branch->id, 0);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-insufficient',
        ])
            ->assertSessionHasErrors('sale');
    }

    public function test_sale_confirm_is_idempotent_for_same_key(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 15.00,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 20);

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertRedirect();

        $payload = ['idempotency_key' => 'sale-confirm-idem-1'];
        $this->actingAs($user)->post(route('sales.confirm', $sale->id), $payload)->assertRedirect();
        $this->actingAs($user)->post(route('sales.confirm', $sale->id), $payload)->assertRedirect();

        $sale->refresh();
        $this->assertSame('confirmed', $sale->status);

        $qty = BranchProductStock::query()
            ->where('branch_id', $branch->id)
            ->where('product_id', $product->id)
            ->value('quantity');

        $this->assertSame('18.000', number_format((float) $qty, 3, '.', ''));
    }
}
