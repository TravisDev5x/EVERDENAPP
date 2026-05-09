<?php

namespace Tests\Feature;

use App\Jobs\ProcessSalePrintJob;
use App\Models\Branch;
use App\Models\CashSession;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class CashPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_open_cash_register_and_pay_confirmed_sale(): void
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
            'price' => 50,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 50);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();
        $user->refresh();

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-cash-1',
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), [
            'amount' => 50,
            'idempotency_key' => 'cash-pay-1',
        ])->assertRedirect();

        $sale->refresh();
        $this->assertSame('paid', $sale->payment_status);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame('50.00', number_format((float) $session->cash_sales_total, 2, '.', ''));
        $this->assertSame($user->branch_id, $session->branch_id);
    }

    public function test_pay_cash_dispatches_print_job_when_print_after_pay_enabled(): void
    {
        config(['printing.auto_after_pay' => true]);
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

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 50,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 50);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-print-auto',
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), [
            'amount' => 50,
            'idempotency_key' => 'cash-pay-print-auto',
        ])->assertRedirect();

        Queue::assertPushed(ProcessSalePrintJob::class);
    }

    public function test_cash_close_requires_note_when_difference_exists(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();

        $session = CashSession::query()->firstOrFail();

        $this->actingAs($user)->post(route('cash.close', $session->id), [
            'closing_amount' => 90,
            'idempotency_key' => 'cash-close-1',
        ])->assertSessionHasErrors('cash');

        $this->actingAs($user)->post(route('cash.close', $session->id), [
            'closing_amount' => 90,
            'closing_note' => 'Faltante por arqueo inicial',
            'idempotency_key' => 'cash-close-2',
        ])->assertRedirect();

        $session->refresh();
        $this->assertSame('closed', $session->status);
        $this->assertSame('-10.00', number_format((float) $session->closing_difference, 2, '.', ''));
    }

    public function test_daily_report_page_is_available(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user)->get(route('reports.daily'))->assertOk();
    }

    public function test_cash_payment_is_idempotent_for_same_key(): void
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
            'price' => 20,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 10);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-cash-2',
        ])->assertRedirect();

        $payload = [
            'amount' => 20,
            'idempotency_key' => 'idem-cobro-001',
        ];

        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), $payload)->assertRedirect();
        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), $payload)->assertRedirect();

        $this->assertDatabaseCount('payments', 1);
    }

    public function test_cash_payment_rejects_mismatched_amount(): void
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
            'price' => 40,
            'tax_rate' => 0,
        ]);
        $this->seedBranchStock($product, $branch->id, 10);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.store'))->assertRedirect();
        $sale = Sale::query()->firstOrFail();

        $this->actingAs($user)->post(route('sales.items.store', $sale->id), [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.confirm', $sale->id), [
            'idempotency_key' => 'sale-confirm-cash-3',
        ])->assertRedirect();

        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), [
            'amount' => 39,
            'idempotency_key' => 'mismatch-001',
        ])->assertSessionHasErrors('payment');
    }

    public function test_cash_close_is_idempotent_for_same_key(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 100,
        ])->assertRedirect();

        $session = CashSession::query()->firstOrFail();
        $payload = [
            'closing_amount' => 100,
            'idempotency_key' => 'cash-close-idem-1',
        ];

        $this->actingAs($user)->post(route('cash.close', $session->id), $payload)->assertRedirect();
        $this->actingAs($user)->post(route('cash.close', $session->id), $payload)->assertRedirect();

        $session->refresh();
        $this->assertSame('closed', $session->status);
        $this->assertSame('cash-close-idem-1', $session->close_idempotency_key);
    }
}
