import ApplicationLogo from '@/Components/ApplicationLogo';
import DisplayChromeControls from '@/Components/DisplayChromeControls';
import SkipToContent from '@/Components/SkipToContent';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
        'Aberden';

    const linkClass = cn(
        'font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline',
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <SkipToContent />
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-slate-400/20 blur-3xl dark:bg-slate-600/15" />
                <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
                <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10" />
            </div>

            <div className="relative">
                <header className="safe-px border-b border-slate-200/90 bg-white/85 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4 lg:px-8">
                        <Link
                            href="/"
                            className="flex min-w-0 items-center gap-3 rounded-xl outline-hidden ring-ring/0 transition focus-visible:ring-2 focus-visible:ring-ring"
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
                            <DisplayChromeControls showDeviceViewToggle={false} />
                        </div>
                    </div>
                </header>

                <div className="safe-px mx-auto max-w-6xl py-8 sm:py-10 lg:flex lg:items-stretch lg:gap-14 lg:px-8 lg:py-14">
                    <div className="mb-10 hidden lg:flex lg:mb-0 lg:w-[42%] lg:flex-col lg:justify-center">
                        <Badge
                            variant="outline"
                            className="w-fit rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium normal-case text-foreground"
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
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
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
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-border/80 via-transparent to-muted/40 opacity-80 dark:from-white/5 dark:to-muted/20" />
                            <Card
                                id="main-content"
                                tabIndex={-1}
                                className="relative gap-0 overflow-hidden rounded-2xl border-border bg-card/95 p-0 shadow-xl shadow-slate-900/5 outline-hidden ring-1 ring-border backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background dark:shadow-slate-950/40"
                            >
                                <CardContent className="p-4 sm:p-6 md:p-8">
                                    {flash?.error ? (
                                        <Alert variant="destructive" className="mb-6" role="alert">
                                            <AlertDescription>{flash.error}</AlertDescription>
                                        </Alert>
                                    ) : null}
                                    {flash?.success ? (
                                        <Alert
                                            className="mb-6 border-primary/25 bg-primary/5 text-foreground dark:border-primary/20 dark:bg-primary/10"
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
