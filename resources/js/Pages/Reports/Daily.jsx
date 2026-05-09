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
