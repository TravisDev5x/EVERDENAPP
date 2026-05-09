<?php

namespace App\Http\Controllers;

use App\Models\CashCountLine;
use App\Models\CashSession;
use App\Models\FinanceJournalEntry;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FinancePageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission(Permissions::FINANCE_VIEW), 403);

        $branchId = (int) app('current_branch_id');
        $tenantId = (int) app('current_tenant_id');
        $date = Carbon::parse($request->query('date', now()->toDateString()))->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $dailyBalanceRows = DB::table('finance_journal_lines as fjl')
            ->join('finance_journal_entries as fje', 'fjl.journal_entry_id', '=', 'fje.id')
            ->join('finance_accounts as fa', 'fjl.account_id', '=', 'fa.id')
            ->where('fje.tenant_id', $tenantId)
            ->where('fje.branch_id', $branchId)
            ->whereBetween('fje.occurred_at', [$date, $endOfDay])
            ->groupBy('fjl.account_id', 'fa.code', 'fa.name', 'fa.type')
            ->orderBy('fa.code')
            ->select([
                'fjl.account_id',
                'fa.code as account_code',
                'fa.name as account_name',
                'fa.type as account_type',
                DB::raw('SUM(fjl.debit_cents) as debit_cents'),
                DB::raw('SUM(fjl.credit_cents) as credit_cents'),
            ])
            ->get();

        $dailyTotalsDebit = (int) $dailyBalanceRows->sum('debit_cents');
        $dailyTotalsCredit = (int) $dailyBalanceRows->sum('credit_cents');

        $entries = FinanceJournalEntry::query()
            ->with(['lines.account:id,code,name'])
            ->where('branch_id', $branchId)
            ->whereBetween('occurred_at', [$date, $endOfDay])
            ->orderByDesc('id')
            ->limit(100)
            ->get([
                'id',
                'branch_id',
                'cash_session_id',
                'event',
                'idempotency_key',
                'occurred_at',
                'description',
                'metadata',
            ]);

        $cashSessionIds = $entries
            ->pluck('cash_session_id')
            ->filter()
            ->unique()
            ->values();

        $countLinesBySession = CashCountLine::query()
            ->whereIn('cash_session_id', $cashSessionIds)
            ->orderBy('denomination_value_cents')
            ->get([
                'cash_session_id',
                'kind',
                'denomination_value_cents',
                'quantity',
                'line_total_cents',
            ])
            ->groupBy('cash_session_id');

        $cashSessions = CashSession::query()
            ->where('branch_id', $branchId)
            ->whereBetween('opened_at', [$date, $endOfDay])
            ->orderByDesc('id')
            ->get([
                'id',
                'status',
                'opening_amount',
                'cash_sales_total',
                'expected_closing_amount',
                'closing_amount',
                'closing_difference',
                'opened_at',
                'closed_at',
            ]);

        return Inertia::render('Finance/Index', [
            'date' => $date->toDateString(),
            'activeBranchId' => $branchId,
            'summary' => [
                'entries_count' => $entries->count(),
                'open_sessions_count' => $cashSessions->where('status', 'open')->count(),
                'closed_sessions_count' => $cashSessions->where('status', 'closed')->count(),
                'shortage_sessions_count' => $cashSessions->filter(
                    fn (CashSession $session): bool => (float) $session->closing_difference < 0
                )->count(),
                'overage_sessions_count' => $cashSessions->filter(
                    fn (CashSession $session): bool => (float) $session->closing_difference > 0
                )->count(),
                'daily_debit_cents' => $dailyTotalsDebit,
                'daily_credit_cents' => $dailyTotalsCredit,
                'daily_book_balanced' => $dailyTotalsDebit === $dailyTotalsCredit,
            ],
            'dailyAccountBalance' => $dailyBalanceRows->map(fn ($row): array => [
                'account_id' => (int) $row->account_id,
                'account_code' => (string) $row->account_code,
                'account_name' => (string) $row->account_name,
                'account_type' => (string) $row->account_type,
                'debit_cents' => (int) $row->debit_cents,
                'credit_cents' => (int) $row->credit_cents,
                'net_movement_cents' => (int) $row->debit_cents - (int) $row->credit_cents,
            ])->values(),
            'entries' => $entries->map(function (FinanceJournalEntry $entry) use ($countLinesBySession): array {
                $debitCents = (int) $entry->lines->sum('debit_cents');
                $creditCents = (int) $entry->lines->sum('credit_cents');

                return [
                    'id' => $entry->id,
                    'cash_session_id' => $entry->cash_session_id,
                    'event' => $entry->event,
                    'idempotency_key' => $entry->idempotency_key,
                    'occurred_at' => optional($entry->occurred_at)->toDateTimeString(),
                    'description' => $entry->description,
                    'debit_cents' => $debitCents,
                    'credit_cents' => $creditCents,
                    'is_balanced' => $debitCents === $creditCents,
                    'lines' => $entry->lines->map(fn ($line): array => [
                        'account_code' => $line->account?->code,
                        'account_name' => $line->account?->name,
                        'debit_cents' => (int) $line->debit_cents,
                        'credit_cents' => (int) $line->credit_cents,
                    ])->values(),
                    'count_lines' => collect($countLinesBySession->get($entry->cash_session_id, collect()))
                        ->map(fn (CashCountLine $line): array => [
                            'kind' => $line->kind,
                            'denomination_value_cents' => (int) $line->denomination_value_cents,
                            'quantity' => (int) $line->quantity,
                            'line_total_cents' => (int) $line->line_total_cents,
                        ])
                        ->values(),
                ];
            }),
        ]);
    }
}
