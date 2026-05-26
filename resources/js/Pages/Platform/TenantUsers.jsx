import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { Button } from '@/Components/ui/button';
import { Head, Link, router } from '@inertiajs/react';

export default function TenantUsers({ tenant, users }) {
    const rows = users?.data ?? [];

    const suspendUser = (user) => {
        const reason =
            window.prompt(
                'Motivo de suspensión (opcional). El usuario no podrá usar la app del negocio hasta reactivación:',
            ) ?? '';

        router.patch(
            route('platform.tenants.users.suspend', [tenant.id, user.id]),
            { reason },
            { preserveScroll: true },
        );
    };

    const activateUser = (user) => {
        router.patch(route('platform.tenants.users.activate', [tenant.id, user.id]), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <Link
                                href={route('platform.tenants.index')}
                                className="text-primary hover:underline"
                            >
                                Negocios
                            </Link>
                            <span className="text-muted-foreground"> / </span>
                            Usuarios
                        </p>
                        <h1 className="text-xl font-semibold text-foreground">{tenant.name}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Clave <span className="font-mono text-xs">{tenant.slug}</span>
                            {!tenant.is_active ? (
                                <span className="ml-2 rounded bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                                    Negocio suspendido
                                </span>
                            ) : null}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Plataforma · Usuarios · ${tenant.name}`} />

            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                    <table className="min-w-full divide-y divide-border text-left text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-foreground">Nombre</th>
                                <th className="px-4 py-3 font-semibold text-foreground">Correo</th>
                                <th className="px-4 py-3 font-semibold text-foreground">Rol</th>
                                <th className="px-4 py-3 font-semibold text-foreground">Estado</th>
                                <th className="px-4 py-3 font-semibold text-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((u) => (
                                <tr key={u.id} className="text-foreground">
                                    <td className="px-4 py-3 font-medium">{u.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {u.role_name ?? '—'}
                                        {u.role_slug ? (
                                            <span className="ml-1 font-mono text-xs text-muted-foreground">
                                                ({u.role_slug})
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.suspended_at ? (
                                            <div>
                                                <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                                                    Suspendido
                                                </span>
                                                {u.suspension_reason ? (
                                                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                                        {u.suspension_reason}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground">
                                                Activo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            {!u.suspended_at ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => suspendUser(u)}
                                                >
                                                    Suspender
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => activateUser(u)}
                                                >
                                                    Reactivar
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination className="mt-6" resource={users} />
            </div>
        </AuthenticatedLayout>
    );
}
