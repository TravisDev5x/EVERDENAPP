<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CashSession;
use App\Models\InventoryAlert;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DailyReportBuilder
{
    /**
     * @return array{
     *   summary: array<string, mixed>,
     *   sales: Collection<int, Sale>,
     *   payments: Collection<int, Payment>,
     *   cashSessions: Collection<int, CashSession>,
     *   auditLogs: Collection<int, AuditLog>,
     *   inventoryAlerts: Collection<int, InventoryAlert>,
     *   salesByCategory: \Illuminate\Support\Collection<int, array<string, mixed>>
     * }
     */
    public function build(int $branchId, Carbon $date): array
    {
        $start = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        // Día operativo: borradores por fecha de creación; confirmadas por fecha de confirmación.
        $sales = Sale::query()
            ->where('branch_id', $branchId)
            ->whereRaw(
                'COALESCE(confirmed_at, created_at) BETWEEN ? AND ?',
                [$start, $endOfDay]
            )
            ->orderByDesc('id')
            ->get(['id', 'branch_id', 'status', 'payment_status', 'total', 'created_at', 'confirmed_at']);

        $payments = Payment::query()
            ->where('branch_id', $branchId)
            ->whereBetween('paid_at', [$start, $endOfDay])
            ->orderByDesc('id')
            ->get(['id', 'branch_id', 'sale_id', 'method', 'amount', 'paid_at']);

        $cashSessions = CashSession::query()
            ->where('branch_id', $branchId)
            ->whereBetween('opened_at', [$start, $endOfDay])
            ->orderByDesc('id')
            ->get([
                'id',
                'branch_id',
                'status',
                'opening_amount',
                'cash_sales_total',
                'expected_closing_amount',
                'closing_amount',
                'closing_difference',
                'closed_at',
            ]);

        $auditLogs = AuditLog::query()
            ->where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $endOfDay])
            ->orderByDesc('id')
            ->get([
                'id',
                'branch_id',
                'event',
                'entity_type',
                'entity_id',
                'user_id',
                'metadata',
                'created_at',
            ]);

        $inventoryAlerts = InventoryAlert::query()
            ->where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $endOfDay])
            ->orderByDesc('id')
            ->get([
                'id',
                'branch_id',
                'product_id',
                'severity',
                'status',
                'current_stock',
                'threshold',
                'triggered_at',
                'resolved_at',
            ]);

        // Ventas por categoría — solo ítems de ventas confirmadas/pagadas del día.
        // Productos sin categoría se agrupan bajo "Sin categoría" (category_id null).
        $salesByCategory = SaleItem::query()
            ->select(
                'products.category_id',
                'product_categories.name as category_name',
                'product_categories.color as category_color',
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as sales_count'),
                DB::raw('SUM(sale_items.quantity) as units_sold'),
                DB::raw('SUM(sale_items.line_total) as revenue')
            )
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('product_categories', 'product_categories.id', '=', 'products.category_id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.status', 'confirmed')
            ->whereRaw(
                'COALESCE(sales.confirmed_at, sales.created_at) BETWEEN ? AND ?',
                [$start, $endOfDay]
            )
            ->groupBy('products.category_id', 'product_categories.name', 'product_categories.color')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'category_id' => $row->category_id,
                'category_name' => $row->category_name ?? 'Sin categoría',
                'category_color' => $row->category_color,
                'sales_count' => (int) $row->sales_count,
                'units_sold' => round((float) $row->units_sold, 3),
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->values();

        return [
            'summary' => [
                'sales_count' => $sales->count(),
                'sales_confirmed_count' => $sales->where('status', 'confirmed')->count(),
                'sales_paid_count' => $sales->where('payment_status', 'paid')->count(),
                'sales_total' => round((float) $sales->sum('total'), 2),
                'payments_total' => round((float) $payments->sum('amount'), 2),
                'cash_sessions_count' => $cashSessions->count(),
                'cash_closed_count' => $cashSessions->where('status', 'closed')->count(),
                'audit_events_count' => $auditLogs->count(),
                'inventory_alerts_open_count' => $inventoryAlerts->where('status', 'open')->count(),
                'categories_with_sales_count' => $salesByCategory->count(),
            ],
            'sales' => $sales,
            'payments' => $payments,
            'cashSessions' => $cashSessions,
            'auditLogs' => $auditLogs,
            'inventoryAlerts' => $inventoryAlerts,
            'salesByCategory' => $salesByCategory,
        ];
    }

    public static function cacheKey(int $tenantId, int $branchId, string $dateYmd): string
    {
        return sprintf('daily_report:%d:%d:%s', $tenantId, $branchId, $dateYmd);
    }
}
