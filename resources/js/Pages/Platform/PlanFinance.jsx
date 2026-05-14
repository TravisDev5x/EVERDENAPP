import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import { Head } from '@inertiajs/react';

function formatMxn(amount, currency = 'MXN') {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function PlanFinance({
    currency_code: currencyCode,
    plan_rows: planRows,
    total_mrr_mxn: totalMrrMxn,
    active_tenants: activeTenants,
    suspended_tenants: suspendedTenants,
    suspended_users: suspendedUsers,
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="max-w-3xl space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        Planes e ingresos estimados
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Ingreso recurrente mensual (MRR) según precios en{' '}
                        <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                            config/platform_plans.php
                        </code>{' '}
                        y negocios activos por código de plan.
                    </p>
                </div>
            }
        >
            <Head title="Plataforma · Planes" />

            <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <section aria-labelledby="kpi-heading" className="space-y-8">
                    <h2 id="kpi-heading" className="sr-only">
                        Resumen
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        <Card className="border-border/80 shadow-xs">
                            <CardHeader className="space-y-1 pb-3">
                                <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    MRR total ({currencyCode})
                                </CardDescription>
                                <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
                                    {formatMxn(totalMrrMxn, currencyCode)}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-border/80 shadow-xs">
                            <CardHeader className="space-y-1 pb-3">
                                <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Negocios activos
                                </CardDescription>
                                <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
                                    {activeTenants}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="border-border/80 shadow-xs sm:col-span-2 lg:col-span-1">
                            <CardHeader className="space-y-3 pb-2">
                                <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Suspendidos (negocio / usuario)
                                </CardDescription>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8 lg:flex-col lg:gap-3">
                                    <div>
                                        <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                                            {suspendedTenants}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">negocios</p>
                                    </div>
                                    <Separator
                                        orientation="vertical"
                                        decorative
                                        className="hidden h-12 w-px shrink-0 bg-border sm:block lg:hidden"
                                    />
                                    <div>
                                        <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                                            {suspendedUsers}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">usuarios</p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    <Separator className="bg-border/60" />

                    <Card className="overflow-hidden border-border/80 shadow-xs">
                        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Desglose por plan
                            </CardTitle>
                            <CardDescription>
                                Solo negocios con estado activo entran en el MRR.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 pb-0 pt-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border/80 bg-muted/20">
                                            <th
                                                scope="col"
                                                className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                            >
                                                Plan (slug)
                                            </th>
                                            <th
                                                scope="col"
                                                className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                            >
                                                Negocios activos
                                            </th>
                                            <th
                                                scope="col"
                                                className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                            >
                                                Precio / mes
                                            </th>
                                            <th
                                                scope="col"
                                                className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                            >
                                                MRR estimado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70">
                                        {planRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-5 py-14 text-center text-muted-foreground"
                                                >
                                                    No hay negocios activos con plan asignado.
                                                </td>
                                            </tr>
                                        ) : (
                                            planRows.map((row) => (
                                                <tr
                                                    key={row.plan_slug}
                                                    className="bg-card transition-colors hover:bg-muted/25"
                                                >
                                                    <td className="px-5 py-4 font-mono text-xs font-medium text-foreground">
                                                        {row.plan_slug}
                                                    </td>
                                                    <td className="px-5 py-4 tabular-nums text-foreground">
                                                        {row.tenant_count}
                                                    </td>
                                                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                                                        {formatMxn(row.monthly_price_mxn, currencyCode)}
                                                    </td>
                                                    <td className="px-5 py-4 font-medium tabular-nums text-foreground">
                                                        {formatMxn(row.mrr_mxn, currencyCode)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
