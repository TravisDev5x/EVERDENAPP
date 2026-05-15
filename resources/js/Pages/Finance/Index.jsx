import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

const centsToMoney = (cents) =>
    (Number(cents || 0) / 100).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });

export default function FinanceIndex({
    date,
    activeBranchId,
    summary,
    dailyAccountBalance,
    entries,
}) {
    const onDateChange = (e) => {
        router.get(
            route('finance.page'),
            { date: e.target.value },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Finanzas
                </h2>
            }
        >
            <Head title="Finanzas" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Sucursal activa: #{activeBranchId}</p>
                                <p className="text-sm text-muted-foreground">
                                    Libro diario y arqueos por fecha.
                                </p>
                            </div>
                            <input
                                type="date"
                                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                value={date}
                                onChange={onDateChange}
                            />
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-3">
                            <p>Asientos: {summary.entries_count}</p>
                            <p>Cajas abiertas: {summary.open_sessions_count}</p>
                            <p>Cajas cerradas: {summary.closed_sessions_count}</p>
                            <p>Con faltante: {summary.shortage_sessions_count}</p>
                            <p>Con sobrante: {summary.overage_sessions_count}</p>
                            <p>
                                Total debe del día: {centsToMoney(summary.daily_debit_cents)}
                            </p>
                            <p>
                                Total haber del día: {centsToMoney(summary.daily_credit_cents)}
                            </p>
                            <p>
                                Libro del día:{' '}
                                {summary.daily_book_balanced ? (
                                    <span className="text-primary">cuadrado</span>
                                ) : (
                                    <span className="font-medium text-destructive">
                                        descuadrado (revisar asientos)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold text-foreground">
                            Balance diario por cuenta
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Sumatoria de movimientos del día por cuenta contable en esta sucursal.
                            El neto es debe menos haber del día.
                        </p>
                        {dailyAccountBalance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Sin movimientos contables en esta fecha.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border text-sm">
                                    <thead>
                                        <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="py-2 pe-3">Código</th>
                                            <th className="py-2 pe-3">Cuenta</th>
                                            <th className="py-2 pe-3">Tipo</th>
                                            <th className="py-2 pe-3 text-right">Debe</th>
                                            <th className="py-2 pe-3 text-right">Haber</th>
                                            <th className="py-2 text-right">Neto día</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {dailyAccountBalance.map((row) => (
                                            <tr key={row.account_id}>
                                                <td className="py-2 pe-3 font-mono text-foreground">
                                                    {row.account_code}
                                                </td>
                                                <td className="py-2 pe-3 text-foreground">
                                                    {row.account_name}
                                                </td>
                                                <td className="py-2 pe-3 text-muted-foreground">
                                                    {row.account_type}
                                                </td>
                                                <td className="py-2 pe-3 text-right">
                                                    {centsToMoney(row.debit_cents)}
                                                </td>
                                                <td className="py-2 pe-3 text-right">
                                                    {centsToMoney(row.credit_cents)}
                                                </td>
                                                <td className="py-2 text-right font-medium text-foreground">
                                                    {centsToMoney(row.net_movement_cents)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <h3 className="mb-3 text-lg font-semibold text-foreground">
                            Asientos contables (inmutables)
                        </h3>
                        <div className="space-y-3">
                            {entries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Sin asientos en esta fecha.</p>
                            ) : (
                                entries.map((entry) => (
                                    <div key={entry.id} className="rounded-lg border border-border bg-muted/20 p-3">
                                        <div className="mb-2 text-sm">
                                            <p className="font-medium text-foreground">
                                                #{entry.id} | {entry.event} | Caja #
                                                {entry.cash_session_id ?? '-'}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {entry.occurred_at} | {entry.description ?? 'Sin descripcion'}
                                            </p>
                                            <p className="text-muted-foreground">
                                                Debe {centsToMoney(entry.debit_cents)} | Haber{' '}
                                                {centsToMoney(entry.credit_cents)} |{' '}
                                                {entry.is_balanced ? 'Balanceado' : 'DESBALANCEADO'}
                                            </p>
                                        </div>

                                        <div className="space-y-1 rounded-md border border-border bg-background p-2 text-xs text-foreground">
                                            {entry.lines.map((line, index) => (
                                                <div key={`${entry.id}-line-${index}`}>
                                                    {line.account_code} - {line.account_name} | D:{' '}
                                                    {centsToMoney(line.debit_cents)} | H:{' '}
                                                    {centsToMoney(line.credit_cents)}
                                                </div>
                                            ))}
                                        </div>

                                        {entry.count_lines.length > 0 && (
                                            <div className="mt-2 rounded-md border border-primary/25 bg-primary/5 p-2 text-xs">
                                                <p className="mb-1 font-medium text-foreground">
                                                    Arqueo por denominaciones
                                                </p>
                                                {entry.count_lines.map((line, index) => (
                                                    <div key={`${entry.id}-count-${index}`}>
                                                        {line.kind === 'bill' ? 'Billete' : 'Moneda'}{' '}
                                                        {centsToMoney(line.denomination_value_cents)} x{' '}
                                                        {line.quantity} ={' '}
                                                        {centsToMoney(line.line_total_cents)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
