import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';

function limitLabel(v) {
    if (v === null || v === undefined) {
        return '∞';
    }
    return v;
}

export default function TenantsIndex({ tenants }) {
    const tenantRows = tenants?.data ?? [];

    const [editingId, setEditingId] = useState(null);
    const [editingPlanId, setEditingPlanId] = useState(null);

    const form = useForm({
        name: '',
        trade_name: '',
    });

    const planForm = useForm({
        plan_slug: '',
        max_users: '',
        max_branches: '',
    });

    const suspend = (tenant) => {
        const reason =
            window.prompt(
                'Motivo de suspensión (opcional). Los usuarios del tenant no podrán usar la app hasta reactivar:',
            ) ?? '';

        router.patch(route('platform.tenants.suspend', tenant.id), { reason }, { preserveScroll: true });
    };

    const activate = (tenant) => {
        router.patch(route('platform.tenants.activate', tenant.id), {}, { preserveScroll: true });
    };

    const openEdit = (tenant) => {
        setEditingPlanId(null);
        planForm.clearErrors();
        setEditingId(tenant.id);
        form.setData({
            name: tenant.name,
            trade_name: tenant.trade_name ?? '',
        });
        form.clearErrors();
    };

    const cancelEdit = () => {
        setEditingId(null);
        form.reset();
        form.clearErrors();
    };

    const submitEdit = (e, tenantId) => {
        e.preventDefault();
        form.patch(route('platform.tenants.update', tenantId), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                form.reset();
            },
        });
    };

    const openPlanEdit = (tenant) => {
        setEditingId(null);
        form.clearErrors();
        setEditingPlanId(tenant.id);
        planForm.setData({
            plan_slug: tenant.plan_slug ?? '',
            max_users: tenant.max_users ?? '',
            max_branches: tenant.max_branches ?? '',
        });
        planForm.clearErrors();
    };

    const cancelPlanEdit = () => {
        setEditingPlanId(null);
        planForm.reset();
        planForm.clearErrors();
    };

    const submitPlan = (e, tenantId) => {
        e.preventDefault();
        planForm.patch(route('platform.tenants.plan.update', tenantId), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingPlanId(null);
                planForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        Directorio de negocios
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Datos generales, plan y límites. Si suspendes un negocio, nadie de ese equipo podrá entrar
                        hasta que lo reactives.
                    </p>
                </div>
            }
        >
            <Head title="Plataforma · Negocios" />

            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                    <table className="min-w-full divide-y divide-border text-left text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Negocio
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Nombre legal / clave
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Personas
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Perfiles en uso
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Plan</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Límites
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenantRows.map((t) => (
                                <Fragment key={t.id}>
                                    <tr className="align-top text-foreground">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">
                                                {t.trade_name || t.name}
                                            </div>
                                            {t.trade_name && (
                                                <div className="text-xs text-muted-foreground">
                                                    Razón social: {t.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div>{t.name}</div>
                                            <div className="text-xs text-muted-foreground">{t.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {t.users_count}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            <ul className="list-inside list-disc space-y-0.5">
                                                {t.roles_breakdown.map((r) => (
                                                    <li key={r.slug}>
                                                        {r.name}: {r.count}
                                                    </li>
                                                ))}
                                                {t.users_without_role > 0 && (
                                                    <li className="text-amber-800 dark:text-amber-200">
                                                        Sin perfil: {t.users_without_role}
                                                    </li>
                                                )}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{t.plan_slug}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            Usuarios: {limitLabel(t.max_users)}
                                            <br />
                                            Sucursales: {limitLabel(t.max_branches)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {t.is_active ? (
                                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                                    Activo
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900 dark:bg-red-900/40 dark:text-red-100">
                                                        Suspendido
                                                    </span>
                                                    {t.suspension_reason && (
                                                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                                            {t.suspension_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <SecondaryButton
                                                    type="button"
                                                    className="text-xs"
                                                    onClick={() => openEdit(t)}
                                                >
                                                    Editar datos
                                                </SecondaryButton>
                                                <Link
                                                    href={route('platform.tenants.users', t.id)}
                                                    className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted"
                                                >
                                                    Usuarios
                                                </Link>
                                                <SecondaryButton
                                                    type="button"
                                                    className="text-xs"
                                                    onClick={() => openPlanEdit(t)}
                                                >
                                                    Plan / límites
                                                </SecondaryButton>
                                                {t.is_active ? (
                                                    <SecondaryButton
                                                        type="button"
                                                        className="text-xs"
                                                        onClick={() => suspend(t)}
                                                    >
                                                        Suspender
                                                    </SecondaryButton>
                                                ) : (
                                                    <PrimaryButton
                                                        type="button"
                                                        className="text-xs"
                                                        onClick={() => activate(t)}
                                                    >
                                                        Reactivar
                                                    </PrimaryButton>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {editingId === t.id && (
                                        <tr className="border-t border-border bg-muted/30">
                                            <td colSpan={8} className="px-4 py-4">
                                                <form
                                                    className="mx-auto max-w-xl space-y-3"
                                                    onSubmit={(e) => submitEdit(e, t.id)}
                                                >
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Visible en directorio; no modifica productos ni finanzas.
                                                    </p>
                                                    <div>
                                                        <InputLabel value="Nombre legal / razón social (interno)" />
                                                        <TextInput
                                                            className="mt-1 w-full"
                                                            value={form.data.name}
                                                            onChange={(e) => form.setData('name', e.target.value)}
                                                            required
                                                        />
                                                        <InputError className="mt-1" message={form.errors.name} />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Nombre comercial (opcional)" />
                                                        <TextInput
                                                            className="mt-1 w-full"
                                                            placeholder="Ej. Farmacia del Centro"
                                                            value={form.data.trade_name}
                                                            onChange={(e) => form.setData('trade_name', e.target.value)}
                                                        />
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Si lo dejas vacío, se muestra el nombre legal en listados.
                                                        </p>
                                                        <InputError className="mt-1" message={form.errors.trade_name} />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <PrimaryButton type="submit" disabled={form.processing}>
                                                            Guardar
                                                        </PrimaryButton>
                                                        <SecondaryButton type="button" onClick={cancelEdit}>
                                                            Cancelar
                                                        </SecondaryButton>
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    )}
                                    {editingPlanId === t.id && (
                                        <tr className="border-t border-border bg-primary/5">
                                            <td colSpan={8} className="px-4 py-4">
                                                <form
                                                    className="mx-auto max-w-xl space-y-3"
                                                    onSubmit={(e) => submitPlan(e, t.id)}
                                                >
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Referencia interna del plan. Si dejas los límites vacíos, no hay
                                                        tope explícito.
                                                    </p>
                                                    <div>
                                                        <InputLabel value="Código de plan (interno)" />
                                                        <TextInput
                                                            className="mt-1 w-full"
                                                            value={planForm.data.plan_slug}
                                                            onChange={(e) => planForm.setData('plan_slug', e.target.value)}
                                                            required
                                                        />
                                                        <InputError className="mt-1" message={planForm.errors.plan_slug} />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Máx. usuarios (vacío = sin límite)" />
                                                        <TextInput
                                                            type="number"
                                                            min={1}
                                                            className="mt-1 w-full"
                                                            value={planForm.data.max_users}
                                                            onChange={(e) => planForm.setData('max_users', e.target.value)}
                                                        />
                                                        <InputError className="mt-1" message={planForm.errors.max_users} />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Máx. sucursales (vacío = sin límite)" />
                                                        <TextInput
                                                            type="number"
                                                            min={1}
                                                            className="mt-1 w-full"
                                                            value={planForm.data.max_branches}
                                                            onChange={(e) =>
                                                                planForm.setData('max_branches', e.target.value)
                                                            }
                                                        />
                                                        <InputError
                                                            className="mt-1"
                                                            message={planForm.errors.max_branches}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <PrimaryButton type="submit" disabled={planForm.processing}>
                                                            Guardar plan
                                                        </PrimaryButton>
                                                        <SecondaryButton type="button" onClick={cancelPlanEdit}>
                                                            Cancelar
                                                        </SecondaryButton>
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination className="mt-6" resource={tenants} />
            </div>
        </AuthenticatedLayout>
    );
}
