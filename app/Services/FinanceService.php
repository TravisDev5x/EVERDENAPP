<?php

namespace App\Services;

use App\Models\CashCountLine;
use App\Models\CashSession;
use App\Models\FinanceAccount;
use App\Models\FinanceJournalEntry;
use App\Models\FinanceJournalLine;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Collection;

class FinanceService
{
    private const ACCOUNT_CASH_ON_HAND = '1010-CASH-ON-HAND';
    private const ACCOUNT_OPENING_FLOAT = '3010-OPENING-FLOAT';
    private const ACCOUNT_SALES_REVENUE = '4010-SALES-REVENUE';
    private const ACCOUNT_VAT_PAYABLE = '2105-VAT-PAYABLE';
    private const ACCOUNT_CASH_OVERAGE = '4090-CASH-OVERAGE';
    private const ACCOUNT_CASH_SHORTAGE = '5090-CASH-SHORTAGE';

    /**
     * @param array<int, array{kind:string,denomination_value_cents:int,quantity:int}> $lines
     */
    public function saveCashCountLines(CashSession $cashSession, array $lines): int
    {
        $cashSession->countLines()->delete();

        $countedTotalCents = 0;
        foreach ($lines as $line) {
            $lineTotal = $line['denomination_value_cents'] * $line['quantity'];
            $countedTotalCents += $lineTotal;

            CashCountLine::query()->create([
                'tenant_id' => (int) $cashSession->tenant_id,
                'cash_session_id' => $cashSession->id,
                'kind' => $line['kind'],
                'denomination_value_cents' => $line['denomination_value_cents'],
                'quantity' => $line['quantity'],
                'line_total_cents' => $lineTotal,
            ]);
        }

        return $countedTotalCents;
    }

    public function recordCashOpen(CashSession $cashSession, User $actor): void
    {
        $openingCents = Money::decimalToCents((string) $cashSession->opening_amount);
        if ($openingCents <= 0) {
            return;
        }

        $this->ensureSystemAccounts((int) $cashSession->tenant_id);
        $accounts = $this->accountsByCode((int) $cashSession->tenant_id);

        $this->createBalancedEntry(
            tenantId: (int) $cashSession->tenant_id,
            branchId: (int) $cashSession->branch_id,
            createdBy: $actor->id,
            cashSessionId: $cashSession->id,
            event: 'cash.open',
            idempotencyKey: "cash-open-{$cashSession->id}",
            sourceType: CashSession::class,
            sourceId: $cashSession->id,
            description: "Apertura de caja #{$cashSession->id}",
            metadata: [
                'opening_amount' => $cashSession->opening_amount,
            ],
            lines: [
                ['account_id' => $accounts[self::ACCOUNT_CASH_ON_HAND], 'debit_cents' => $openingCents, 'credit_cents' => 0],
                ['account_id' => $accounts[self::ACCOUNT_OPENING_FLOAT], 'debit_cents' => 0, 'credit_cents' => $openingCents],
            ],
        );
    }

    public function recordCashPayment(Sale $sale, Payment $payment, User $actor): void
    {
        $subtotalCents = Money::decimalToCents((string) $sale->subtotal);
        $taxCents = Money::decimalToCents((string) $sale->tax_total);
        $totalCents = Money::decimalToCents((string) $payment->amount);

        $this->ensureSystemAccounts((int) $sale->tenant_id);
        $accounts = $this->accountsByCode((int) $sale->tenant_id);

        $creditLines = [
            ['account_id' => $accounts[self::ACCOUNT_SALES_REVENUE], 'debit_cents' => 0, 'credit_cents' => $subtotalCents],
        ];
        if ($taxCents > 0) {
            $creditLines[] = ['account_id' => $accounts[self::ACCOUNT_VAT_PAYABLE], 'debit_cents' => 0, 'credit_cents' => $taxCents];
        }

        $this->createBalancedEntry(
            tenantId: (int) $sale->tenant_id,
            branchId: (int) $sale->branch_id,
            createdBy: $actor->id,
            cashSessionId: (int) $payment->cash_session_id,
            event: 'payment.cash.applied',
            idempotencyKey: 'payment-cash-'.$payment->idempotency_key,
            sourceType: Sale::class,
            sourceId: $sale->id,
            description: "Cobro efectivo venta #{$sale->id}",
            metadata: [
                'payment_id' => $payment->id,
                'sale_id' => $sale->id,
            ],
            lines: [
                ['account_id' => $accounts[self::ACCOUNT_CASH_ON_HAND], 'debit_cents' => $totalCents, 'credit_cents' => 0],
                ...$creditLines,
            ],
        );
    }

    public function recordCashCloseDifference(CashSession $cashSession, int $differenceCents, User $actor): void
    {
        if ($differenceCents === 0) {
            return;
        }

        $this->ensureSystemAccounts((int) $cashSession->tenant_id);
        $accounts = $this->accountsByCode((int) $cashSession->tenant_id);

        if ($differenceCents > 0) {
            $lines = [
                ['account_id' => $accounts[self::ACCOUNT_CASH_ON_HAND], 'debit_cents' => $differenceCents, 'credit_cents' => 0],
                ['account_id' => $accounts[self::ACCOUNT_CASH_OVERAGE], 'debit_cents' => 0, 'credit_cents' => $differenceCents],
            ];
            $event = 'cash.close.overage';
        } else {
            $absolute = abs($differenceCents);
            $lines = [
                ['account_id' => $accounts[self::ACCOUNT_CASH_SHORTAGE], 'debit_cents' => $absolute, 'credit_cents' => 0],
                ['account_id' => $accounts[self::ACCOUNT_CASH_ON_HAND], 'debit_cents' => 0, 'credit_cents' => $absolute],
            ];
            $event = 'cash.close.shortage';
        }

        $this->createBalancedEntry(
            tenantId: (int) $cashSession->tenant_id,
            branchId: (int) $cashSession->branch_id,
            createdBy: $actor->id,
            cashSessionId: $cashSession->id,
            event: $event,
            idempotencyKey: "cash-close-diff-{$cashSession->id}",
            sourceType: CashSession::class,
            sourceId: $cashSession->id,
            description: "Ajuste diferencia cierre caja #{$cashSession->id}",
            metadata: [
                'closing_difference_cents' => $differenceCents,
                'closing_difference' => Money::centsToDecimal($differenceCents),
            ],
            lines: $lines,
        );
    }

    /**
     * @return Collection<string, int>
     */
    private function accountsByCode(int $tenantId): Collection
    {
        return FinanceAccount::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('code', [
                self::ACCOUNT_CASH_ON_HAND,
                self::ACCOUNT_OPENING_FLOAT,
                self::ACCOUNT_SALES_REVENUE,
                self::ACCOUNT_VAT_PAYABLE,
                self::ACCOUNT_CASH_OVERAGE,
                self::ACCOUNT_CASH_SHORTAGE,
            ])
            ->pluck('id', 'code');
    }

    private function ensureSystemAccounts(int $tenantId): void
    {
        $defaults = [
            ['code' => self::ACCOUNT_CASH_ON_HAND, 'name' => 'Caja general', 'type' => 'asset'],
            ['code' => self::ACCOUNT_OPENING_FLOAT, 'name' => 'Fondo inicial de caja', 'type' => 'equity'],
            ['code' => self::ACCOUNT_SALES_REVENUE, 'name' => 'Ventas mostrador', 'type' => 'income'],
            ['code' => self::ACCOUNT_VAT_PAYABLE, 'name' => 'IVA trasladado por pagar', 'type' => 'liability'],
            ['code' => self::ACCOUNT_CASH_OVERAGE, 'name' => 'Sobrante de caja', 'type' => 'income'],
            ['code' => self::ACCOUNT_CASH_SHORTAGE, 'name' => 'Faltante de caja', 'type' => 'expense'],
        ];

        foreach ($defaults as $account) {
            FinanceAccount::query()->firstOrCreate(
                ['tenant_id' => $tenantId, 'code' => $account['code']],
                [
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'is_system' => true,
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * @param array<int, array{account_id:int,debit_cents:int,credit_cents:int}> $lines
     * @param array<string, mixed> $metadata
     */
    private function createBalancedEntry(
        int $tenantId,
        int $branchId,
        int $createdBy,
        ?int $cashSessionId,
        string $event,
        string $idempotencyKey,
        string $sourceType,
        int $sourceId,
        string $description,
        array $metadata,
        array $lines
    ): void {
        $existing = FinanceJournalEntry::query()
            ->where('tenant_id', $tenantId)
            ->where('idempotency_key', $idempotencyKey)
            ->exists();
        if ($existing) {
            return;
        }

        $debitTotal = 0;
        $creditTotal = 0;
        foreach ($lines as $line) {
            $debitTotal += $line['debit_cents'];
            $creditTotal += $line['credit_cents'];
        }
        if ($debitTotal !== $creditTotal) {
            throw new \RuntimeException('Asiento desbalanceado en modulo financiero.');
        }

        $entry = FinanceJournalEntry::query()->create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'cash_session_id' => $cashSessionId,
            'created_by' => $createdBy,
            'event' => $event,
            'idempotency_key' => $idempotencyKey,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'occurred_at' => now(),
            'description' => $description,
            'metadata' => $metadata,
        ]);

        foreach ($lines as $line) {
            FinanceJournalLine::query()->create([
                'tenant_id' => $tenantId,
                'journal_entry_id' => $entry->id,
                'account_id' => $line['account_id'],
                'debit_cents' => $line['debit_cents'],
                'credit_cents' => $line['credit_cents'],
            ]);
        }
    }
}
