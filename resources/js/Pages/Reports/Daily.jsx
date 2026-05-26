import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const dateInputClass =
    'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40';

const cardClass = 'rounded-xl border border-border bg-card p-6 shadow-xs';

const listRowClass =
    'rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground transition-colors hover:bg-muted/30';

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

export default function Daily({
    date,
    summary: summaryProp,
    sales: salesProp,
    payments: paymentsProp,
    cashSessions: cashSessionsProp,
    auditLogs: auditLogsProp,
    inventoryAlerts: inventoryAlertsProp,
    salesByCategory: salesByCategoryProp,
    activeBranchId,
}) {
    const summary = summaryProp && typeof summaryProp === 'object' ? summaryProp : {};
    const sales = asArray(salesProp);
    const payments = asArray(paymentsProp);
    const cashSessions = asArray(cashSessionsProp);
    const auditLogs = asArray(auditLogsProp);
    const inventoryAlerts = asArray(inventoryAlertsProp);
    const salesByCategory = asArray(salesByCategoryProp);

    const [waitingReport, setWaitingReport] = useState(false);

    const onDateChange = (e) => {
        router.get(
            route('reports.daily'),
            { date: e.target.value },
            { preserveScroll: true },
        );
    };

    const queueRebuild = () => {
        router.post(
            route('reports.daily.rebuild'),
            { date },
            {
                preserveScroll: true,
                onSuccess: () => setWaitingReport(true),
            },
        );
    };

    useEffect(() => {
        if (!waitingReport) {
            return undefined;
        }

        const id = setInterval(async () => {
            try {
                const { data } = await axios.get(route('reports.daily.status'), {
                    params: { date },
                });
                if (data.ready) {
                    setWaitingReport(false);
                    router.reload({ preserveScroll: true });
                }
            } catch {
                setWaitingReport(false);
            }
        }, 2000);

        return () => clearInterval(id);
    }, [waitingReport, date]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Reporte diario
                </h2>
            }
        >
            <Head title="Reporte diario" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className={cardClass}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">Fecha: {date ?? '—'}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="date"
                                    className={dateInputClass}
                                    value={date ?? ''}
                                    onChange={onDateChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={queueRebuild}
                                    disabled={waitingReport}
                                >
                                    {waitingReport ? 'Regenerando…' : 'Regenerar (cola)'}
                                </Button>
                            </div>
                        </div>
                        {waitingReport && (
                            <p className="mb-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-950 dark:text-amber-100">
                                El reporte se está generando en segundo plano. Esta página se actualizará sola cuando
                                esté listo.
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Sucursal activa: #{activeBranchId ?? '—'}
                        </p>
                        <div className="mt-3 grid gap-3 text-sm text-foreground sm:grid-cols-3">
                            <p>Ventas: {summary.sales_count ?? 0}</p>
                            <p>Ventas confirmadas: {summary.sales_confirmed_count ?? 0}</p>
                            <p>Ventas pagadas: {summary.sales_paid_count ?? 0}</p>
                            <p>Total ventas: ${summary.sales_total ?? 0}</p>
                            <p>Total cobros: ${summary.payments_total ?? 0}</p>
                            <p>Cierres de caja: {summary.cash_closed_count ?? 0}</p>
                            <p>Eventos auditoría: {summary.audit_events_count ?? 0}</p>
                            <p>Alertas inventario abiertas: {summary.inventory_alerts_open_count ?? 0}</p>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">Ventas</h3>
                        <div className="space-y-2 text-sm">
                            {sales.length === 0 ? (
                                <p className="text-muted-foreground">Sin ventas en el día.</p>
                            ) : (
                                sales.map((sale) => (
                                    <div key={sale.id} className={listRowClass}>
                                        #{sale.id} | {sale.status} | {sale.payment_status} | $
                                        {sale.total}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">Ventas por categoría</h3>
                        {salesByCategory.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin ventas confirmadas en el día.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-hidden rounded-lg border border-border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Categoría</th>
                                                <th className="px-3 py-2 text-right">Tickets</th>
                                                <th className="px-3 py-2 text-right">Unidades</th>
                                                <th className="px-3 py-2 text-right">Ingresos</th>
                                                <th className="px-3 py-2 text-right">% del total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(() => {
                                                const totalRevenue = salesByCategory.reduce(
                                                    (sum, row) => sum + Number(row.revenue ?? 0),
                                                    0,
                                                );
                                                return salesByCategory.map((row) => {
                                                    const pct =
                                                        totalRevenue > 0
                                                            ? (Number(row.revenue) / totalRevenue) * 100
                                                            : 0;
                                                    return (
                                                        <tr key={row.category_id ?? 'uncategorized'}>
                                                            <td className="px-3 py-2">
                                                                <span className="inline-flex items-center gap-2">
                                                                    <span
                                                                        className="size-2.5 shrink-0 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                row.category_color ?? '#94a3b8',
                                                                        }}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span className="font-medium text-foreground">
                                                                        {row.category_name}
                                                                    </span>
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                                {row.sales_count}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                                {row.units_sold}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums font-medium text-foreground">
                                                                ${Number(row.revenue).toFixed(2)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                                {pct.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-2">
                                    {(() => {
                                        const totalRevenue = salesByCategory.reduce(
                                            (sum, row) => sum + Number(row.revenue ?? 0),
                                            0,
                                        );
                                        return salesByCategory.map((row) => {
                                            const pct =
                                                totalRevenue > 0
                                                    ? (Number(row.revenue) / totalRevenue) * 100
                                                    : 0;
                                            return (
                                                <div key={`bar-${row.category_id ?? 'uncategorized'}`}>
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{row.category_name}</span>
                                                        <span className="tabular-nums">
                                                            ${Number(row.revenue).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor:
                                                                    row.category_color ?? '#94a3b8',
                                                            }}
                                                            aria-label={`${row.category_name} ${pct.toFixed(1)}%`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">Cobros</h3>
                        <div className="space-y-2 text-sm">
                            {payments.length === 0 ? (
                                <p className="text-muted-foreground">Sin cobros en el día.</p>
                            ) : (
                                payments.map((payment) => (
                                    <div key={payment.id} className={listRowClass}>
                                        Pago #{payment.id} | Venta #{payment.sale_id} |{' '}
                                        {payment.method} | ${payment.amount}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">Cajas</h3>
                        <div className="space-y-2 text-sm">
                            {cashSessions.length === 0 ? (
                                <p className="text-muted-foreground">Sin sesiones de caja en el día.</p>
                            ) : (
                                cashSessions.map((session) => (
                                    <div key={session.id} className={listRowClass}>
                                        Caja #{session.id} | {session.status} | Fondo: $
                                        {session.opening_amount} | Efectivo ventas: $
                                        {session.cash_sales_total} | Esperado: $
                                        {session.expected_closing_amount ?? 0} | Cierre: $
                                        {session.closing_amount ?? 0} | Diferencia: $
                                        {session.closing_difference ?? 0}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">Auditoría</h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Registro de acciones relevantes en la sucursal para la fecha seleccionada.
                        </p>
                        <div className="space-y-2 text-sm">
                            {auditLogs.length === 0 ? (
                                <p className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
                                    Sin eventos en el día.
                                </p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} className={listRowClass}>
                                        <span className="font-mono text-xs text-muted-foreground">#{log.id}</span>
                                        {' · '}
                                        <span className="font-medium">{log.event}</span>
                                        {' · '}
                                        <span className="text-muted-foreground">
                                            {log.entity_type}#{log.entity_id ?? '—'}
                                        </span>
                                        {' · '}
                                        <span className="text-muted-foreground">
                                            Usuario #{log.user_id ?? '—'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className="mb-3 text-lg font-semibold text-foreground">
                            Alertas de inventario
                        </h3>
                        <div className="space-y-2 text-sm">
                            {inventoryAlerts.length === 0 ? (
                                <p className="text-muted-foreground">Sin alertas en el día.</p>
                            ) : (
                                inventoryAlerts.map((alert) => (
                                    <div key={alert.id} className={listRowClass}>
                                        Alerta #{alert.id} | Producto #{alert.product_id} |{' '}
                                        {alert.severity} | {alert.status} | Stock{' '}
                                        {alert.current_stock} / Min {alert.threshold}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
