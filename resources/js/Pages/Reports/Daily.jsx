import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Daily({
    date,
    summary,
    sales,
    payments,
    cashSessions,
    auditLogs,
    inventoryAlerts,
    salesByCategory = [],
    activeBranchId,
}) {
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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Reporte diario
                </h2>
            }
        >
            <Head title="Reporte diario" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-gray-500">Fecha: {date}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="date"
                                    className="rounded-md border-gray-300"
                                    value={date}
                                    onChange={onDateChange}
                                />
                                <SecondaryButton type="button" onClick={queueRebuild} disabled={waitingReport}>
                                    {waitingReport ? 'Regenerando…' : 'Regenerar (cola)'}
                                </SecondaryButton>
                            </div>
                        </div>
                        {waitingReport && (
                            <p className="mb-2 text-xs text-amber-800">
                                El reporte se está generando en segundo plano. Esta página se actualizará sola cuando
                                esté listo.
                            </p>
                        )}
                        <p className="text-sm text-gray-500">
                            Sucursal activa: #{activeBranchId}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <p>Ventas: {summary.sales_count}</p>
                            <p>Ventas confirmadas: {summary.sales_confirmed_count}</p>
                            <p>Ventas pagadas: {summary.sales_paid_count}</p>
                            <p>Total ventas: ${summary.sales_total}</p>
                            <p>Total cobros: ${summary.payments_total}</p>
                            <p>Cierres de caja: {summary.cash_closed_count}</p>
                            <p>Eventos auditoria: {summary.audit_events_count}</p>
                            <p>Alertas inventario abiertas: {summary.inventory_alerts_open_count}</p>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">Ventas</h3>
                        <div className="space-y-2 text-sm">
                            {sales.length === 0 ? (
                                <p className="text-gray-600">Sin ventas en el dia.</p>
                            ) : (
                                sales.map((sale) => (
                                    <div key={sale.id} className="rounded border p-2">
                                        #{sale.id} | {sale.status} | {sale.payment_status} | $
                                        {sale.total}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">Ventas por categoría</h3>
                        {salesByCategory.length === 0 ? (
                            <p className="text-sm text-gray-600">Sin ventas confirmadas en el día.</p>
                        ) : (
                            <div className="space-y-3">
                                {/* Tabla de categorías */}
                                <div className="overflow-hidden rounded border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">Categoría</th>
                                                <th className="px-3 py-2 text-right font-medium">Tickets</th>
                                                <th className="px-3 py-2 text-right font-medium">Unidades</th>
                                                <th className="px-3 py-2 text-right font-medium">Ingresos</th>
                                                <th className="px-3 py-2 text-right font-medium">% del total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
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
                                                                        className="size-2.5 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                row.category_color ?? '#94a3b8',
                                                                        }}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span className="font-medium text-gray-900">
                                                                        {row.category_name}
                                                                    </span>
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                                                {row.sales_count}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                                                {row.units_sold}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                                                                ${Number(row.revenue).toFixed(2)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                                                {pct.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Barras de proporción */}
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
                                                    <div className="flex justify-between text-xs text-gray-600">
                                                        <span>{row.category_name}</span>
                                                        <span className="tabular-nums">
                                                            ${Number(row.revenue).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
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

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">Cobros</h3>
                        <div className="space-y-2 text-sm">
                            {payments.length === 0 ? (
                                <p className="text-gray-600">Sin cobros en el dia.</p>
                            ) : (
                                payments.map((payment) => (
                                    <div key={payment.id} className="rounded border p-2">
                                        Pago #{payment.id} | Venta #{payment.sale_id} |{' '}
                                        {payment.method} | ${payment.amount}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">Cajas</h3>
                        <div className="space-y-2 text-sm">
                            {cashSessions.length === 0 ? (
                                <p className="text-gray-600">Sin sesiones de caja en el dia.</p>
                            ) : (
                                cashSessions.map((session) => (
                                    <div key={session.id} className="rounded border p-2">
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

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">Auditoria</h3>
                        <div className="space-y-2 text-sm">
                            {auditLogs.length === 0 ? (
                                <p className="text-gray-600">Sin eventos en el dia.</p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="rounded border p-2">
                                        #{log.id} | {log.event} | Entidad {log.entity_type}#
                                        {log.entity_id ?? '-'} | Usuario #{log.user_id ?? '-'}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold">
                            Alertas de inventario
                        </h3>
                        <div className="space-y-2 text-sm">
                            {inventoryAlerts.length === 0 ? (
                                <p className="text-gray-600">Sin alertas en el dia.</p>
                            ) : (
                                inventoryAlerts.map((alert) => (
                                    <div key={alert.id} className="rounded border p-2">
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
