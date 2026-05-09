import ApplicationLogo from '@/Components/ApplicationLogo';
import AppearanceToggle from '@/Components/AppearanceToggle';
import SkipToContent from '@/Components/SkipToContent';
import { Link, usePage } from '@inertiajs/react';

/**
 * Shell plataforma — mismos tokens que la app autenticada (sin slate/indigo legacy).
 */
export default function PlatformLayout({ header, children }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SkipToContent />
            <nav
                aria-label="Principal"
                className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
            >
                <div className="mx-auto flex min-h-[3.5rem] max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 sm:py-0 lg:px-8">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4">
                        <Link
                            href="/"
                            className="rounded-md focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <ApplicationLogo className="block h-8 w-auto fill-current text-foreground" />
                        </Link>
                        <span className="text-sm font-semibold text-foreground">
                            Plataforma
                        </span>
                        <Link
                            href={route('platform.tenants.index')}
                            className="rounded-md text-sm font-medium text-primary hover:text-primary/90 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            Negocios
                        </Link>
                        <Link
                            href={route('profile.edit')}
                            className="rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            Perfil
                        </Link>
                        <AppearanceToggle />
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex min-h-[44px] shrink-0 items-center rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        Cerrar sesión
                    </Link>
                </div>
            </nav>

            {header && (
                <header className="border-b border-border bg-card shadow-xs">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main
                id="main-content"
                tabIndex={-1}
                className="outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
                <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-xl border border-primary/25 bg-secondary p-3 text-sm font-medium text-secondary-foreground">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                            {flash.error}
                        </div>
                    )}
                </div>
                {children}
            </main>
        </div>
    );
}
