import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function formatMoney(amount, currency = 'MXN') {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatCompact(n) {
    return new Intl.NumberFormat('es-MX').format(n);
}

function formatPct(pct) {
    if (pct === null || pct === undefined || Number.isNaN(pct)) {
        return null;
    }
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1).replace(/\.0$/, '')} %`;
}

function formatShortDateTime(iso) {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(d);
}

function formatShortDate(iso) {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(d);
}

function badgeToneClasses(tone) {
    switch (tone) {
        case 'red':
            return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200';
        case 'amber':
            return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200';
    }
}

function stockRowFromAlert(a) {
    const label = a.product_name ?? `Producto #${a.product_id}`;
    if (a.current_stock <= 0) {
        return { label, badge: 'Agotado', tone: 'red' };
    }
    if (a.threshold > 0 && a.current_stock <= a.threshold) {
        return { label, badge: 'Bajo mínimo', tone: 'amber' };
    }
    if (a.severity === 'warning') {
        return { label, badge: 'Advertencia', tone: 'amber' };
    }
    if (a.severity === 'critical') {
        return { label, badge: 'Crítico', tone: 'amber' };
    }
    return { label, badge: `${a.current_stock} uds.`, tone: 'slate' };
}

function PeriodPills({ options, active }) {
    return (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Periodo del dashboard">
            <span className="text-xs text-gray-500 dark:text-slate-400">Periodo:</span>
            {(options ?? [7, 30, 90]).map((p) => (
                <Link
                    key={p}
                    href={`${route('dashboard')}?period=${p}`}
                    preserveScroll
                    className={
                        'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
                        (active === p
                            ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700')
                    }
                >
                    {p} días
                </Link>
            ))}
        </div>
    );
}

export default function Dashboard({
    branch,
    period_options: periodOptions,
    today_date: todayDate,
    kpis,
    chart_sales: chartSales,
    stock_alerts: stockAlerts,
    top_sellers: topSellers,
    team_today: teamToday,
    top_products: topProducts,
    slow_movers: slowMovers,
    summary,
    metrics,
    cash,
    operations,
    flags,
}) {
    const { tenant } = usePage().props;
    const currency = tenant?.currency_code ?? 'MXN';
    const slug = tenant?.slug ?? '';

    const revenues = chartSales?.map((d) => d.revenue) ?? [];
    const maxChart = Math.max(...revenues, 1);
    const spark = kpis?.sparkline_daily_counts ?? [];
    const maxSpark = Math.max(...spark, 1);

    const stockRows = (stockAlerts ?? []).map(stockRowFromAlert);

    const pctWeek = kpis?.avg_ticket_week_vs_prev_pct;
    const pctLine =
        pctWeek === null || pctWeek === undefined
            ? 'Sin datos suficientes para comparar la semana anterior.'
            : `${formatPct(pctWeek)} ticket promedio (últimos 7 días vs. 7 días previos)`;

    const revVsPrev = kpis?.revenue_vs_prev_period_pct;
    const revPrevLine =
        revVsPrev === null || revVsPrev === undefined
            ? null
            : `${formatPct(revVsPrev)} ingresos vs. periodo anterior del mismo largo`;

    const pending = operations?.pending ?? {};
    const recentPayments = operations?.recent_payments ?? [];
    const lastPaidIso = operations?.freshness?.last_paid_at;

    const reportHref =
        flags?.can_view_reports && todayDate
            ? `${route('reports.daily')}?date=${encodeURIComponent(todayDate)}`
            : null;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                            {slug}
                        </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-3 sm:items-end">
                        <PeriodPills options={periodOptions} active={kpis?.period_days ?? 30} />
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                            Último cobro registrado:{' '}
                            <span className="font-medium text-gray-700 dark:text-slate-300">
                                {formatShortDateTime(lastPaidIso)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-8 rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900 sm:p-5">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                        Operación
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                Caja
                            </h3>
                            {cash?.open ? (
                                <dl className="mt-3 space-y-1 text-xs text-gray-600 dark:text-slate-400">
                                    <div className="flex justify-between gap-2">
                                        <dt>Estado</dt>
                                        <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                                            Abierta
                                        </dd>
                                    </div>
                                    {cash.open.register_name && (
                                        <div className="flex justify-between gap-2">
                                            <dt>Caja física</dt>
                                            <dd className="text-right">{cash.open.register_name}</dd>
                                        </div>
                                    )}
                                    {cash.open.opened_by && (
                                        <div className="flex justify-between gap-2">
                                            <dt>Apertura por</dt>
                                            <dd className="text-right">{cash.open.opened_by}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2">
                                        <dt>Abierta</dt>
                                        <dd className="text-right">
                                            {formatShortDateTime(cash.open.opened_at)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt>Fondo inicial</dt>
                                        <dd className="tabular-nums text-right">
                                            {formatMoney(cash.open.opening_amount, currency)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt>Ventas en efectivo (sesión)</dt>
                                        <dd className="tabular-nums text-right font-medium text-gray-900 dark:text-slate-100">
                                            {formatMoney(cash.open.cash_sales_total, currency)}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <div className="mt-3 text-xs text-gray-600 dark:text-slate-400">
                                    <p>No hay sesión de caja abierta.</p>
                                    {cash?.last_closed?.closed_at && (
                                        <dl className="mt-3 space-y-1 border-t border-gray-200 pt-3 dark:border-slate-600">
                                            <div className="flex justify-between gap-2">
                                                <dt>Último cierre</dt>
                                                <dd className="text-right">
                                                    {formatShortDateTime(cash.last_closed.closed_at)}
                                                </dd>
                                            </div>
                                            {cash.last_closed.closing_difference != null && (
                                                <div className="flex justify-between gap-2">
                                                    <dt>Diferencia de cierre</dt>
                                                    <dd
                                                        className={
                                                            'tabular-nums text-right font-medium ' +
                                                            (Math.abs(cash.last_closed.closing_difference) < 0.005
                                                                ? 'text-gray-800 dark:text-slate-200'
                                                                : 'text-amber-700 dark:text-amber-400')
                                                        }
                                                    >
                                                        {formatMoney(
                                                            cash.last_closed.closing_difference,
                                                            currency,
                                                        )}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    )}
                                    {cash?.can_open && (
                                        <Link
                                            href={route('sales.page', { open_cash: 1 })}
                                            className="mt-3 inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                        >
                                            Abrir caja →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                Ventas pendientes
                            </h3>
                            <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-slate-400">
                                <li className="flex justify-between gap-2">
                                    <span>Borradores</span>
                                    <strong className="tabular-nums text-gray-900 dark:text-slate-100">
                                        {pending.draft_count ?? 0}
                                    </strong>
                                </li>
                                <li className="flex justify-between gap-2">
                                    <span>Confirmadas sin cobrar</span>
                                    <strong className="tabular-nums text-gray-900 dark:text-slate-100">
                                        {pending.unpaid_confirmed_count ?? 0}
                                    </strong>
                                </li>
                                <li className="flex justify-between gap-2 border-t border-gray-200 pt-2 dark:border-slate-600">
                                    <span>Total por cobrar</span>
                                    <strong className="tabular-nums text-gray-900 dark:text-slate-100">
                                        {formatMoney(pending.unpaid_confirmed_total ?? 0, currency)}
                                    </strong>
                                </li>
                            </ul>
                            <Link
                                href={route('sales.page')}
                                className="mt-3 inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            >
                                Ir a ventas →
                            </Link>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                Últimos cobros
                            </h3>
                            {recentPayments.length === 0 ? (
                                <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                                    Sin cobros recientes.
                                </p>
                            ) : (
                                <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto text-xs">
                                    {recentPayments.map((p) => (
                                        <li
                                            key={p.id}
                                            className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 dark:border-slate-700"
                                        >
                                            <div className="min-w-0">
                                                <Link
                                                    href={route('sales.page', p.sale_id)}
                                                    className="font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    Venta #{p.sale_id}
                                                </Link>
                                                <p className="truncate text-gray-500 dark:text-slate-500">
                                                    {p.user_name}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-semibold tabular-nums text-gray-900 dark:text-slate-100">
                                                    {formatMoney(p.amount, currency)}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {formatShortDateTime(p.paid_at)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-slate-400">
                    <p className="max-w-xl">
                        <span className="font-medium text-gray-700 dark:text-slate-300">
                            {branch?.name ?? 'Sucursal'}
                        </span>
                        {' · '}
                        Métricas de ventas cobradas (efectivo aplicado). Periodo seleccionado:{' '}
                        <strong>{kpis?.period_days ?? 30} días</strong>.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {reportHref && (
                            <Link
                                href={reportHref}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                            >
                                Reporte operativo de hoy
                            </Link>
                        )}
                    </div>
                </div>

                <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-slate-400">
                    <span>
                        Productos activos:{' '}
                        <strong className="text-gray-900 dark:text-slate-100">
                            {summary?.active_products_count ?? 0}
                        </strong>
                    </span>
                    <span>
                        Alertas de stock abiertas:{' '}
                        <strong className="text-gray-900 dark:text-slate-100">
                            {summary?.open_stock_alerts_count ?? 0}
                        </strong>
                    </span>
                    <span>
                        Valor inventario estimado (sucursal activa · stock × precio):{' '}
                        <strong className="tabular-nums text-gray-900 dark:text-slate-100">
                            {formatMoney(summary?.estimated_inventory_value ?? 0, currency)}
                        </strong>
                    </span>
                </p>

                <section className="mb-10">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                        Finanzas
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <div className="absolute right-4 top-4 h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-800" aria-hidden />
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                Ticket promedio
                            </p>
                            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-slate-50">
                                {kpis?.avg_ticket_period != null
                                    ? formatMoney(kpis.avg_ticket_period, currency)
                                    : '—'}
                            </p>
                            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                Últimos {kpis?.period_days ?? 30} días (ventas cobradas)
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">{pctLine}</p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                Ventas cobradas (tickets)
                            </p>
                            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-slate-50">
                                {formatCompact(kpis?.paid_sales_period ?? 0)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                Número de cobros en el periodo · tendencia 7 días (cobros / día)
                            </p>
                            <div className="mt-4 flex h-10 items-end gap-1">
                                {spark.map((v, i) => (
                                    <div
                                        key={i}
                                        title={`${v} cobros`}
                                        className="flex-1 rounded-sm bg-gray-200 dark:bg-slate-600"
                                        style={{
                                            height: `${Math.max(12, (v / maxSpark) * 100)}%`,
                                        }}
                                    />
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-gray-500 dark:text-slate-500">
                                Mix: el volumen de tickets explica junto al ticket medio los ingresos del
                                periodo.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                Ingresos del periodo
                            </p>
                            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-slate-50">
                                {formatMoney(kpis?.revenue_period ?? 0, currency)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                vs. periodo anterior ({formatMoney(kpis?.revenue_previous_period ?? 0, currency)})
                            </p>
                            {revPrevLine && (
                                <p className="mt-1 text-xs font-medium text-gray-700 dark:text-slate-300">
                                    {revPrevLine}
                                </p>
                            )}
                            <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                                <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                                    Hoy
                                </p>
                                <p className="text-lg font-semibold tabular-nums text-emerald-800 dark:text-emerald-100">
                                    {formatMoney(kpis?.revenue_today ?? 0, currency)}
                                </p>
                                <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90">
                                    {kpis?.paid_sales_today ?? 0} cobros registrados
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-10 grid gap-4 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                            Productos con más ingresos
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Líneas vendidas en ventas cobradas · periodo {kpis?.period_days ?? 30} días
                        </p>
                        {(topProducts ?? []).length === 0 ? (
                            <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
                                Sin ventas en el periodo.
                            </p>
                        ) : (
                            <ul className="mt-4 divide-y divide-gray-100 dark:divide-slate-800">
                                {topProducts.map((row) => (
                                    <li
                                        key={row.product_id}
                                        className="flex items-center justify-between gap-3 py-3 first:pt-0"
                                    >
                                        <span className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-slate-200">
                                            {row.name}
                                        </span>
                                        <span className="shrink-0 text-right text-xs tabular-nums text-gray-600 dark:text-slate-400">
                                            <span className="block font-semibold text-gray-900 dark:text-slate-100">
                                                {formatMoney(row.revenue, currency)}
                                            </span>
                                            {formatCompact(row.qty_sold)} uds.
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                            Baja rotación (stock)
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Sin movimiento de inventario en más de 30 días (esta sucursal)
                        </p>
                        {(slowMovers ?? []).length === 0 ? (
                            <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
                                Ningún SKU supera el umbral o aún no hay historial de movimientos.
                            </p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {slowMovers.map((row) => (
                                    <li
                                        key={row.product_id}
                                        className="flex items-start justify-between gap-2 border-b border-gray-50 pb-3 text-sm last:border-0 dark:border-slate-800"
                                    >
                                        <span className="font-medium text-gray-800 dark:text-slate-200">
                                            {row.product_name}
                                        </span>
                                        <span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">
                                            Último mov.: {formatShortDate(row.last_move_at)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <div className="mb-10 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                Ingresos por día
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Ventas con cobro aplicado · Últimos 14 días (sucursal activa)
                            </p>
                            <div className="mt-8 flex h-48 items-end gap-1.5 border-b border-gray-100 pb-1 dark:border-slate-700">
                                {(chartSales ?? []).map((point, i) => (
                                    <div
                                        key={point.date ?? i}
                                        className="flex flex-1 flex-col items-center gap-2"
                                        title={`${point.date}: ${formatMoney(point.revenue, currency)}`}
                                    >
                                        <div
                                            className="w-full rounded-t-md bg-gray-700 dark:bg-slate-500"
                                            style={{
                                                height: `${Math.max(
                                                    8,
                                                    (point.revenue / maxChart) * 100,
                                                )}%`,
                                                minHeight: '8px',
                                            }}
                                        />
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                            {point.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {revenues.every((v) => v === 0) && (
                                <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
                                    No hay cobros registrados en este rango.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                Alertas de stock
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Alertas abiertas (críticas y advertencias)
                            </p>
                            {stockRows.length === 0 ? (
                                <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
                                    Sin alertas abiertas en esta sucursal.
                                </p>
                            ) : (
                                <ul className="mt-4 space-y-3">
                                    {stockRows.map((row, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 dark:border-slate-800"
                                        >
                                            <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                                {row.label}
                                            </span>
                                            <span
                                                className={
                                                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                                                    badgeToneClasses(row.tone)
                                                }
                                            >
                                                {row.badge}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <section>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                        Equipo
                    </h2>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                Mayor volumen cobrado (periodo)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Últimos {kpis?.period_days ?? 30} días
                            </p>
                            {(topSellers ?? []).length === 0 ? (
                                <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
                                    Aún no hay ventas cobradas en el periodo.
                                </p>
                            ) : (
                                <ul className="mt-6 divide-y divide-gray-100 dark:divide-slate-800">
                                    {topSellers.map((emp, idx) => (
                                        <li
                                            key={`${emp.name}-${idx}`}
                                            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">
                                                        {emp.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        {emp.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-slate-200">
                                                {formatMoney(emp.amount, currency)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                Cobros de hoy por usuario
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Ventas cobradas el día actual (sucursal activa)
                            </p>
                            {(teamToday ?? []).length === 0 ? (
                                <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
                                    Sin cobros hoy todavía.
                                </p>
                            ) : (
                                <ul className="mt-6 divide-y divide-gray-100 dark:divide-slate-800">
                                    {teamToday.map((emp, idx) => (
                                        <li
                                            key={`today-${emp.name}-${idx}`}
                                            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-slate-100">
                                                    {emp.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    {emp.role}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-slate-200">
                                                {formatMoney(emp.amount, currency)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>

                <div className="mt-10 rounded-xl border border-dashed border-gray-200 bg-white/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-slate-200">
                        Accesos rápidos
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('inventory.page')}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/60"
                        >
                            Inventario
                        </Link>
                        <Link
                            href={route('sales.page')}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        >
                            Ventas
                        </Link>
                        {flags?.can_view_reports && (
                            <Link
                                href={route('reports.daily')}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                            >
                                Actividad del día
                            </Link>
                        )}
                        <Link
                            href={route('finance.page')}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                            Cuentas
                        </Link>
                    </div>
                    {cash?.can_open && !cash?.has_open_session && (
                        <div className="mt-4">
                            <Link
                                href={route('sales.page', { open_cash: 1 })}
                                className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                            >
                                Abrir caja
                            </Link>
                            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                                No hay caja abierta en la sucursal activa.
                            </p>
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600 dark:text-slate-400">
                        <span>
                            Cobros hoy:{' '}
                            <strong className="text-gray-900 dark:text-slate-100">
                                {metrics?.today_paid_sales_count ?? 0}
                            </strong>
                        </span>
                        <span>
                            Ingresos hoy:{' '}
                            <strong className="text-gray-900 dark:text-slate-100">
                                {formatMoney(metrics?.today_revenue ?? 0, currency)}
                            </strong>
                        </span>
                        <span>
                            Alertas críticas abiertas:{' '}
                            <strong className="text-red-700 dark:text-red-400">
                                {metrics?.critical_alerts_count ?? 0}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
