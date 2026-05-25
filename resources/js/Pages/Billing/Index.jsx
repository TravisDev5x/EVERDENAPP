import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';

function formatPriceMxn(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(iso) {
    if (!iso) {
        return '—';
    }
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(iso));
}

function formatCardBrand(pmType) {
    if (!pmType) {
        return 'Tarjeta';
    }
    return pmType.charAt(0).toUpperCase() + pmType.slice(1);
}

function StatusBadge({ status }) {
    switch (status) {
        case 'trial':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                >
                    Período de prueba
                </Badge>
            );
        case 'active':
            return (
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                    Activa
                </Badge>
            );
        case 'past_due':
            return <Badge variant="destructive">Pago pendiente</Badge>;
        case 'suspended':
            return <Badge variant="destructive">Suspendida</Badge>;
        case 'cancelled':
            return <Badge variant="secondary">Cancelada</Badge>;
        default:
            return <Badge variant="outline">{status ?? 'Desconocido'}</Badge>;
    }
}

export default function BillingIndex({ tenant, subscription, billing_portal_url }) {
    const hasPaymentMethod = tenant?.pm_type && tenant?.pm_last_four;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Facturación y suscripción
                </h2>
            }
        >
            <Head title="Facturación" />

            <div className="py-6 pb-24 sm:py-8 md:pb-8">
                <div className="mx-auto max-w-3xl space-y-4 px-4 sm:space-y-6 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tu suscripción</CardTitle>
                            <CardDescription>Estado actual de tu cuenta en Aberden</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">Estado:</span>
                                <StatusBadge status={tenant?.status} />
                            </div>

                            {tenant?.is_on_trial ? (
                                <p className="text-sm leading-relaxed text-foreground">
                                    Te quedan {tenant.trial_days_left} días de prueba gratuita. Tu período de
                                    prueba termina el {formatDate(tenant.trial_ends_at)}.
                                </p>
                            ) : null}

                            <p className="text-sm text-muted-foreground">
                                {hasPaymentMethod ? (
                                    <>
                                        Tarjeta {formatCardBrand(tenant.pm_type)} terminada en{' '}
                                        <span className="font-medium text-foreground">{tenant.pm_last_four}</span>
                                    </>
                                ) : (
                                    'Sin método de pago registrado'
                                )}
                            </p>

                            {subscription?.stripe_status ? (
                                <p className="text-xs text-muted-foreground">
                                    Stripe: {subscription.stripe_status}
                                    {subscription.ends_at
                                        ? ` · finaliza el ${formatDate(subscription.ends_at)}`
                                        : null}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Plan actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tenant?.plan ? (
                                <div className="space-y-1">
                                    <p className="text-lg font-semibold text-foreground">{tenant.plan.name}</p>
                                    <p className="text-2xl font-bold tabular-nums text-foreground">
                                        {formatPriceMxn(tenant.plan.price_mxn)}
                                        <span className="text-base font-normal text-muted-foreground"> /mes</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay un plan asignado.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gestionar suscripción</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {billing_portal_url ? (
                                <>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Desde el portal de Stripe puedes actualizar tu método de pago, cambiar de plan o
                                        cancelar tu suscripción.
                                    </p>
                                    <Button asChild className="min-h-11">
                                        <a href={billing_portal_url} target="_blank" rel="noreferrer">
                                            Gestionar suscripción en Stripe
                                        </a>
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Portal de facturación no disponible. Contacta a soporte en{' '}
                                    <a
                                        href="mailto:contacto@aberden.com"
                                        className="font-medium text-primary underline-offset-2 hover:underline"
                                    >
                                        contacto@aberden.com
                                    </a>
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>¿Necesitas ayuda con tu suscripción?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="link" asChild className={cn('h-auto p-0 text-primary')}>
                                <Link href="mailto:contacto@aberden.com">contacto@aberden.com</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
