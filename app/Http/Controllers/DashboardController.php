<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashSession;
use App\Models\InventoryAlert;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $branchId = (int) app('current_branch_id');
        $branch = Branch::query()->find($branchId);

        $requested = (int) $request->query('period', 30);
        $periodDays = in_array($requested, [7, 30, 90], true) ? $requested : 30;

        $periodEnd = now()->endOfDay();
        $periodStart = now()->copy()->subDays($periodDays - 1)->startOfDay();

        $prevPeriodEnd = $periodStart->copy()->subDay()->endOfDay();
        $prevPeriodStart = $periodStart->copy()->subDays($periodDays)->startOfDay();

        $stockAlerts = InventoryAlert::query()
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->whereIn('severity', ['critical', 'warning'])
            ->with(['product' => static fn ($q) => $q->select('id', 'name')])
            ->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END")
            ->orderByDesc('triggered_at')
            ->limit(12)
            ->get(['id', 'product_id', 'current_stock', 'threshold', 'triggered_at', 'severity']);

        $periodAgg = Sale::query()
            ->where('branch_id', $branchId)
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [$periodStart, $periodEnd])
            ->selectRaw('COUNT(*) as sale_count, COALESCE(SUM(total), 0) as revenue_sum')
            ->first();

        $prevAgg = Sale::query()
            ->where('branch_id', $branchId)
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [$prevPeriodStart, $prevPeriodEnd])
            ->selectRaw('COUNT(*) as sale_count, COALESCE(SUM(total), 0) as revenue_sum')
            ->first();

        $saleCount = (int) ($periodAgg->sale_count ?? 0);
        $revenuePeriod = round((float) ($periodAgg->revenue_sum ?? 0), 2);
        $avgTicketPeriod = $saleCount > 0 ? round($revenuePeriod / $saleCount, 2) : null;

        $revenuePrev = round((float) ($prevAgg->revenue_sum ?? 0), 2);
        $revenueVsPrevPct = null;
        if ($revenuePrev > 0) {
            $revenueVsPrevPct = round((($revenuePeriod - $revenuePrev) / $revenuePrev) * 100, 1);
        } elseif ($revenuePeriod > 0 && $revenuePrev <= 0) {
            $revenueVsPrevPct = null;
        }

        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $todayAgg = Sale::query()
            ->where('branch_id', $branchId)
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [$todayStart, $todayEnd])
            ->selectRaw('COUNT(*) as sale_count, COALESCE(SUM(total), 0) as revenue_sum')
            ->first();

        $lastWeekStart = now()->subDays(6)->startOfDay();
        $lastWeekAvg = $this->averageTicketBetween($branchId, $lastWeekStart, $todayEnd);
        $prevWeekStart = now()->subDays(13)->startOfDay();
        $prevWeekEnd = now()->subDays(7)->endOfDay();
        $prevWeekAvg = $this->averageTicketBetween($branchId, $prevWeekStart, $prevWeekEnd);

        $avgTicketWeekVsPrevPct = null;
        if ($lastWeekAvg !== null && $prevWeekAvg !== null && $prevWeekAvg > 0) {
            $avgTicketWeekVsPrevPct = round((($lastWeekAvg - $prevWeekAvg) / $prevWeekAvg) * 100, 1);
        }

        $sparklineCounts = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = today()->subDays($i);
            $sparklineCounts[] = Sale::query()
                ->where('branch_id', $branchId)
                ->where('payment_status', 'paid')
                ->whereDate('paid_at', $d)
                ->count();
        }

        $chartSales = [];
        for ($i = 13; $i >= 0; $i--) {
            $day = today()->subDays($i);
            $rev = (float) Sale::query()
                ->where('branch_id', $branchId)
                ->where('payment_status', 'paid')
                ->whereBetween('paid_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                ->sum('total');
            $chartSales[] = [
                'label' => $this->weekdayShort($day),
                'date' => $day->toDateString(),
                'revenue' => round($rev, 2),
            ];
        }

        $topSellers = Sale::query()
            ->where('sales.branch_id', $branchId)
            ->where('sales.payment_status', 'paid')
            ->whereBetween('sales.paid_at', [$periodStart, $periodEnd])
            ->join('users', 'users.id', '=', 'sales.user_id')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->groupBy('sales.user_id', 'users.name', 'roles.name')
            ->orderByDesc(DB::raw('SUM(sales.total)'))
            ->limit(5)
            ->get([
                DB::raw('SUM(sales.total) as revenue'),
                'users.name as user_name',
                'roles.name as role_name',
            ]);

        $teamToday = Sale::query()
            ->where('sales.branch_id', $branchId)
            ->where('sales.payment_status', 'paid')
            ->whereBetween('sales.paid_at', [$todayStart, $todayEnd])
            ->join('users', 'users.id', '=', 'sales.user_id')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->groupBy('sales.user_id', 'users.name', 'roles.name')
            ->orderByDesc(DB::raw('SUM(sales.total)'))
            ->limit(6)
            ->get([
                DB::raw('SUM(sales.total) as revenue'),
                'users.name as user_name',
                'roles.name as role_name',
            ]);

        $topProducts = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.payment_status', 'paid')
            ->whereBetween('sales.paid_at', [$periodStart, $periodEnd])
            ->groupBy('sale_items.product_id')
            ->selectRaw(
                'sale_items.product_id, MAX(sale_items.product_name) as product_name, SUM(sale_items.quantity) as qty_sold, SUM(sale_items.line_total) as revenue'
            )
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        $slowMoverRows = DB::table('inventory_movements')
            ->select('product_id', DB::raw('MAX(created_at) as last_move_at'))
            ->where('branch_id', $branchId)
            ->groupBy('product_id')
            ->havingRaw('MAX(created_at) < ?', [now()->subDays(30)])
            ->orderBy('last_move_at')
            ->limit(5)
            ->get();

        $slowIds = collect($slowMoverRows)->pluck('product_id')->unique()->filter()->all();
        $slowNames = count($slowIds) > 0
            ? Product::query()->whereIn('id', $slowIds)->pluck('name', 'id')
            : collect();

        $slowMovers = collect($slowMoverRows)->map(function ($row) use ($slowNames) {
            $pid = (int) $row->product_id;

            return [
                'product_id' => $pid,
                'product_name' => $slowNames[$pid] ?? 'Producto #'.$pid,
                'last_move_at' => Carbon::parse($row->last_move_at)->toIso8601String(),
            ];
        })->values()->all();

        $estimatedInventoryValue = $this->estimatedInventoryValueForBranch($branchId);

        $openCashSession = CashSession::query()
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->with([
                'user:id,name',
                'cashRegister:id,name,code',
            ])
            ->first();

        $lastClosedSession = CashSession::query()
            ->where('branch_id', $branchId)
            ->where('status', 'closed')
            ->orderByDesc('closed_at')
            ->first([
                'closed_at',
                'closing_amount',
                'expected_closing_amount',
                'closing_difference',
                'opened_at',
                'cash_sales_total',
            ]);

        $draftCount = Sale::query()
            ->where('branch_id', $branchId)
            ->where('status', 'draft')
            ->count();

        $unpaidAgg = Sale::query()
            ->where('branch_id', $branchId)
            ->where('status', 'confirmed')
            ->where('payment_status', 'unpaid')
            ->selectRaw('COUNT(*) as c, COALESCE(SUM(total), 0) as t')
            ->first();

        $recentPayments = Payment::query()
            ->where('payments.branch_id', $branchId)
            ->whereNotNull('payments.paid_at')
            ->join('users', 'users.id', '=', 'payments.user_id')
            ->orderByDesc('payments.paid_at')
            ->limit(8)
            ->get([
                'payments.id',
                'payments.amount',
                'payments.paid_at',
                'payments.sale_id',
                'users.name as user_name',
            ]);

        $lastPaidAt = Sale::query()
            ->where('branch_id', $branchId)
            ->where('payment_status', 'paid')
            ->max('paid_at');

        $hasOpenCashSession = $openCashSession !== null;

        $activeProductsCount = Product::query()->where('is_active', true)->count();

        $user = $request->user();

        return Inertia::render('Dashboard', [
            'branch' => [
                'id' => $branchId,
                'name' => $branch?->name ?? 'Sucursal',
            ],
            'today_date' => now()->toDateString(),
            'period_options' => [7, 30, 90],
            'kpis' => [
                'period_days' => $periodDays,
                'avg_ticket_period' => $avgTicketPeriod,
                'avg_ticket_week_vs_prev_pct' => $avgTicketWeekVsPrevPct,
                'paid_sales_period' => $saleCount,
                'revenue_period' => $revenuePeriod,
                'revenue_previous_period' => $revenuePrev,
                'revenue_vs_prev_period_pct' => $revenueVsPrevPct,
                'revenue_today' => round((float) ($todayAgg->revenue_sum ?? 0), 2),
                'paid_sales_today' => (int) ($todayAgg->sale_count ?? 0),
                'sparkline_daily_counts' => $sparklineCounts,
            ],
            'chart_sales' => $chartSales,
            'stock_alerts' => $stockAlerts->map(static fn ($a) => [
                'id' => $a->id,
                'product_id' => $a->product_id,
                'product_name' => $a->product?->name,
                'current_stock' => (int) $a->current_stock,
                'threshold' => (int) $a->threshold,
                'severity' => $a->severity,
            ]),
            'top_sellers' => $topSellers->map(static fn ($r) => [
                'name' => $r->user_name,
                'role' => $r->role_name ?? 'Usuario',
                'amount' => round((float) $r->revenue, 2),
            ]),
            'team_today' => $teamToday->map(static fn ($r) => [
                'name' => $r->user_name,
                'role' => $r->role_name ?? 'Usuario',
                'amount' => round((float) $r->revenue, 2),
            ]),
            'top_products' => $topProducts->map(static fn ($r) => [
                'product_id' => (int) $r->product_id,
                'name' => $r->product_name ?? 'Producto',
                'qty_sold' => round((float) $r->qty_sold, 3),
                'revenue' => round((float) $r->revenue, 2),
            ]),
            'slow_movers' => $slowMovers,
            'summary' => [
                'active_products_count' => $activeProductsCount,
                'open_stock_alerts_count' => InventoryAlert::query()
                    ->where('branch_id', $branchId)
                    ->where('status', 'open')
                    ->count(),
                'estimated_inventory_value' => $estimatedInventoryValue,
            ],
            'operations' => [
                'pending' => [
                    'draft_count' => $draftCount,
                    'unpaid_confirmed_count' => (int) ($unpaidAgg->c ?? 0),
                    'unpaid_confirmed_total' => round((float) ($unpaidAgg->t ?? 0), 2),
                ],
                'recent_payments' => $recentPayments->map(static fn ($p) => [
                    'id' => $p->id,
                    'sale_id' => $p->sale_id,
                    'amount' => round((float) $p->amount, 2),
                    'paid_at' => $p->paid_at?->toIso8601String(),
                    'user_name' => $p->user_name,
                ]),
                'freshness' => [
                    'last_paid_at' => $lastPaidAt
                        ? Carbon::parse($lastPaidAt)->toIso8601String()
                        : null,
                ],
            ],
            'cash' => [
                'has_open_session' => $hasOpenCashSession,
                'can_open' => $user?->can('open', CashSession::class) ?? false,
                'open' => $openCashSession ? [
                    'opened_at' => $openCashSession->opened_at->toIso8601String(),
                    'opening_amount' => round((float) $openCashSession->opening_amount, 2),
                    'cash_sales_total' => round((float) $openCashSession->cash_sales_total, 2),
                    'opened_by' => $openCashSession->user?->name,
                    'register_name' => $openCashSession->cashRegister?->name,
                    'register_code' => $openCashSession->cashRegister?->code,
                ] : null,
                'last_closed' => $lastClosedSession ? [
                    'closed_at' => $lastClosedSession->closed_at?->toIso8601String(),
                    'closing_amount' => $lastClosedSession->closing_amount !== null
                        ? round((float) $lastClosedSession->closing_amount, 2)
                        : null,
                    'expected_closing_amount' => $lastClosedSession->expected_closing_amount !== null
                        ? round((float) $lastClosedSession->expected_closing_amount, 2)
                        : null,
                    'closing_difference' => $lastClosedSession->closing_difference !== null
                        ? round((float) $lastClosedSession->closing_difference, 2)
                        : null,
                    'cash_sales_total' => round((float) ($lastClosedSession->cash_sales_total ?? 0), 2),
                ] : null,
            ],
            'flags' => [
                'can_view_reports' => $user?->hasPermission(Permissions::REPORTS_VIEW) ?? false,
            ],
            'metrics' => [
                'today_paid_sales_count' => (int) ($todayAgg->sale_count ?? 0),
                'today_revenue' => round((float) ($todayAgg->revenue_sum ?? 0), 2),
                'critical_alerts_count' => InventoryAlert::query()
                    ->where('branch_id', $branchId)
                    ->where('status', 'open')
                    ->where('severity', 'critical')
                    ->count(),
            ],
        ]);
    }

    /**
     * Stock × precio: usa branch_product_stock si existe; si no, quantity_on_hand legado; último recurso, saldos por movimientos.
     */
    private function estimatedInventoryValueForBranch(int $branchId): float
    {
        $tenantId = (int) app('current_tenant_id');

        if (Schema::hasTable('branch_product_stock')) {
            return round((float) DB::table('branch_product_stock as bps')
                ->join('products as p', 'p.id', '=', 'bps.product_id')
                ->where('bps.branch_id', $branchId)
                ->where('p.tenant_id', $tenantId)
                ->where('p.is_active', true)
                ->selectRaw('COALESCE(SUM(bps.quantity * p.price), 0) as v')
                ->value('v'), 2);
        }

        if (Schema::hasColumn('products', 'quantity_on_hand')) {
            return round((float) Product::query()
                ->where('is_active', true)
                ->selectRaw('COALESCE(SUM(quantity_on_hand * price), 0) as v')
                ->value('v'), 2);
        }

        if (! Schema::hasTable('inventory_movements')) {
            return 0.0;
        }

        $latestIds = DB::table('inventory_movements')
            ->where('branch_id', $branchId)
            ->selectRaw('MAX(id) as id')
            ->groupBy('product_id')
            ->pluck('id')
            ->filter();

        if ($latestIds->isEmpty()) {
            return 0.0;
        }

        return round((float) DB::table('inventory_movements as im')
            ->join('products as p', 'p.id', '=', 'im.product_id')
            ->whereIn('im.id', $latestIds->all())
            ->where('p.tenant_id', $tenantId)
            ->where('p.is_active', true)
            ->selectRaw('COALESCE(SUM(im.balance_after * p.price), 0) as v')
            ->value('v'), 2);
    }

    private function averageTicketBetween(int $branchId, Carbon $start, Carbon $end): ?float
    {
        $row = Sale::query()
            ->where('branch_id', $branchId)
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw('COUNT(*) as c, COALESCE(SUM(total), 0) as s')
            ->first();
        $count = (int) ($row->c ?? 0);
        if ($count === 0) {
            return null;
        }

        return round((float) ($row->s ?? 0) / $count, 2);
    }

    private function weekdayShort(Carbon $day): string
    {
        $map = [
            1 => 'Lun',
            2 => 'Mar',
            3 => 'Mié',
            4 => 'Jue',
            5 => 'Vie',
            6 => 'Sáb',
            7 => 'Dom',
        ];

        return $map[$day->isoWeekday()] ?? $day->format('D');
    }
}
