import ApplicationLogo from '@/Components/ApplicationLogo';
import AppearanceToggle from '@/Components/AppearanceToggle';
import SkipToContent from '@/Components/SkipToContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

const defaultHeadline = 'Tu operación en un solo lugar';
const defaultSubline =
    'Catálogo, ventas en mostrador, caja e inventario alineados por sucursal.';

/**
 * Shell de páginas públicas (login, registro, etc.) — mismos fondos y jerarquía que Welcome.jsx + UI shadcn.
 */
export default function GuestLayout({
    children,
    headline = defaultHeadline,
    subline = defaultSubline,
}) {
    const { appName, flash } = usePage().props;
    const brand =
        (typeof appName === 'string' && appName) ||
        import.meta.env.VITE_APP_NAME ||
        'EVERDEN';

    const linkClass = cn(
        'font-medium text-emerald-700 underline-offset-4 hover:text-emerald-600 hover:underline',
        'dark:text-emerald-400 dark:hover:text-emerald-300',
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <SkipToContent />
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/12" />
                <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
                <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10" />
            </div>

            <div className="relative">
                <header className="border-b border-slate-200/90 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <Link
                            href="/"
                            className="flex min-w-0 items-center gap-3 rounded-xl outline-hidden ring-emerald-500/0 transition focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 dark:ring-white/10">
                                <ApplicationLogo className="h-8 w-8 fill-white opacity-95" />
                            </span>
                            <span className="min-w-0 text-left">
                                <span className="block truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                                    {brand}
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                    Punto de venta · demo
                                </span>
                            </span>
                        </Link>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400">
                                <Link href="/">Inicio</Link>
                            </Button>
                            <AppearanceToggle />
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:flex lg:items-stretch lg:gap-14 lg:px-8 lg:py-14">
                    <div className="mb-10 hidden lg:flex lg:mb-0 lg:w-[42%] lg:flex-col lg:justify-center">
                        <Badge
                            variant="outline"
                            className="w-fit rounded-full border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium normal-case text-emerald-900 dark:border-emerald-500/25 dark:text-emerald-300"
                        >
                            Acceso seguro
                        </Badge>
                        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl lg:leading-tight">
                            {headline}
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                            {subline}
                        </p>
                        <ul className="mt-10 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-3">
                                <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                                    aria-hidden
                                />
                                Misma cuenta para todas las pantallas del negocio.
                            </li>
                            <li className="flex gap-3">
                                <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500"
                                    aria-hidden
                                />
                                Roles y permisos según tu equipo.
                            </li>
                            <li className="flex gap-3">
                                <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                                    aria-hidden
                                />
                                Datos de demostración · sin compromiso.
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-1 flex-col lg:justify-center">
                        <div className="mb-6 lg:hidden">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {headline}
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {subline}
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/15 opacity-80 dark:from-emerald-500/10" />
                            <Card
                                id="main-content"
                                tabIndex={-1}
                                className="relative gap-0 overflow-hidden rounded-2xl border-border bg-card/95 p-0 shadow-xl shadow-slate-900/5 outline-hidden ring-1 ring-border backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background dark:shadow-slate-950/40"
                            >
                                <CardContent className="p-6 sm:p-8">
                                    {flash?.error ? (
                                        <Alert variant="destructive" className="mb-6" role="alert">
                                            <AlertDescription>{flash.error}</AlertDescription>
                                        </Alert>
                                    ) : null}
                                    {flash?.success ? (
                                        <Alert
                                            className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                                            role="status"
                                        >
                                            <AlertDescription className="text-current">
                                                {flash.success}
                                            </AlertDescription>
                                        </Alert>
                                    ) : null}
                                    {children}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs text-muted-foreground">
                            <Button variant="link" asChild className={cn('h-auto p-0 text-xs', linkClass)}>
                                <Link href={route('legal.privacy')}>Aviso de privacidad</Link>
                            </Button>
                            <span aria-hidden="true" className="text-border">
                                ·
                            </span>
                            <Button variant="link" asChild className={cn('h-auto p-0 text-xs', linkClass)}>
                                <Link href={route('legal.terms')}>Términos del servicio</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
