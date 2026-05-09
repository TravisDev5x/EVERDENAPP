<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CashSession;
use App\Models\InventoryAlert;
use App\Models\Payment;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DailyReportBuilder
{
    /**
     * @return array{
     *   summary: array<string, mixed>,
     *   sales: Collection<int, Sale>,
     *   payments: Collection<int, Payment>,
     *   cashSessions: Collection<int, CashSession>,
     *   auditLogs: Collection<int, AuditLog>,
     *   inventoryAlerts: Collection<int, InventoryAlert>
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
            ],
            'sales' => $sales,
            'payments' => $payments,
            'cashSessions' => $cashSessions,
            'auditLogs' => $auditLogs,
            'inventoryAlerts' => $inventoryAlerts,
        ];
    }

    public static function cacheKey(int $tenantId, int $branchId, string $dateYmd): string
    {
        return sprintf('daily_report:%d:%d:%s', $tenantId, $branchId, $dateYmd);
    }
}
