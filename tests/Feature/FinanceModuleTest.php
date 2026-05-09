<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashSession;
use App\Models\FinanceJournalEntry;
use App\Models\FinanceJournalLine;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_cash_open_creates_finance_ledger_entry(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user)->post(route('cash.open'), [
            'opening_amount' => 150,
        ])->assertRedirect();

        $session = CashSession::query()->firstOrFail();
        $entry = FinanceJournalEntry::query()
            ->where('cash_session_id', $session->id)
            ->where('event', 'cash.open')
            ->first();

        $this->assertNotNull($entry);
        $this->assertDatabaseHas('finance_journal_lines', [
            'journal_entry_id' => $entry->id,
            'debit_cents' => 15000,
            'credit_cents' => 0,
        ]);
        $this->assertDatabaseHas('finance_journal_lines', [
            'journal_entry_id' => $entry->id,
            'debit_cents' => 0,
            'credit_cents' => 15000,
        ]);
    }

    public function test_cash_payment_creates_balanced_finance_entry(): void
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
            'price' => 100,
            'tax_rate' => 16,
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
            'idempotency_key' => 'finance-confirm-1',
        ])->assertRedirect();

        $sale->refresh();
        $this->actingAs($user)->post(route('sales.pay-cash', $sale->id), [
            'amount' => $sale->total,
            'idempotency_key' => 'finance-pay-1',
        ])->assertRedirect();

        $this->assertDatabaseCount('payments', 1);
        $entry = FinanceJournalEntry::query()
            ->where('event', 'payment.cash.applied')
            ->where('idempotency_key', 'payment-cash-finance-pay-1')
            ->first();

        $this->assertNotNull($entry);

        $lines = FinanceJournalLine::query()->where('journal_entry_id', $entry->id)->get();
        $this->assertGreaterThan(0, $lines->count());
        $this->assertSame($lines->sum('debit_cents'), $lines->sum('credit_cents'));
    }
}
