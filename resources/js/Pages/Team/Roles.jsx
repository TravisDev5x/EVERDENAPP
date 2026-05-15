import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useState } from 'react';

export default function TeamRoles({
    permissionsGrouped,
    matrix,
    canManageRoles,
}) {
    const groups = useMemo(() => Object.keys(permissionsGrouped || {}), [permissionsGrouped]);

    const [selections, setSelections] = useState(() => {
        const init = {};
        matrix.forEach((row) => {
            init[row.id] = [...(row.permission_keys || [])];
        });
        return init;
    });

    const createForm = useForm({
        name: '',
        slug: '',
        description: '',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('team.roles.store'), { preserveScroll: true, onSuccess: () => createForm.reset() });
    };

    const togglePerm = (roleId, key) => {
        if (!canManageRoles) return;
        setSelections((prev) => {
            const list = new Set(prev[roleId] || []);
            if (list.has(key)) {
                list.delete(key);
            } else {
                list.add(key);
            }
            return { ...prev, [roleId]: Array.from(list) };
        });
    };

    const saveRole = (roleId) => {
        router.post(
            route('team.roles.permissions.sync', roleId),
            { permission_keys: selections[roleId] || [] },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Equipo · Roles y matriz
                </h2>
            }
        >
            <Head title="Roles" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <p className="text-sm text-muted-foreground">
                            Matriz de permisos por rol. Los permisos se definen en codigo (
                            <code className="text-xs">App\Support\Permissions</code>
                            ) y se asignan a cada rol. Version demo: edicion completa si tienes permiso.
                        </p>
                    </div>

                    {canManageRoles && (
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <h3 className="mb-3 text-lg font-semibold text-foreground">Crear rol personalizado</h3>
                            <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitCreate}>
                                <div>
                                    <InputLabel value="Nombre" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError className="mt-1" message={createForm.errors.name} />
                                </div>
                                <div>
                                    <InputLabel value="Slug (opcional)" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        placeholder="ej. encargado-turno"
                                        value={createForm.data.slug}
                                        onChange={(e) => createForm.setData('slug', e.target.value)}
                                    />
                                    <InputError className="mt-1" message={createForm.errors.slug} />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel value="Descripcion" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <PrimaryButton disabled={createForm.processing}>Crear rol</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-border bg-card p-6 shadow-xs">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">Matriz permisos × roles</h3>
                        <table className="min-w-full border-collapse border border-border text-left text-xs">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-20 border border-border border-r-2 border-r-border bg-card p-2">
                                        Permiso
                                    </th>
                                    {matrix.map((role) => (
                                        <th
                                            key={role.id}
                                            className="min-w-[160px] max-w-[220px] border border-border p-2 align-top text-left"
                                        >
                                            <RoleColumnHeader
                                                role={role}
                                                canManageRoles={canManageRoles}
                                                onSavePermissions={() => saveRole(role.id)}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => (
                                    <Fragment key={group}>
                                        <tr>
                                            <td
                                                colSpan={matrix.length + 1}
                                                className="bg-muted/80 p-2 font-semibold text-foreground"
                                            >
                                                {group}
                                            </td>
                                        </tr>
                                        {(permissionsGrouped[group] || []).map((perm) => (
                                            <tr key={perm.key}>
                                                <td className="sticky left-0 z-10 border border-border border-r-2 border-r-border bg-card p-2">
                                                    <div className="font-medium text-foreground">{perm.label}</div>
                                                    <div className="text-[10px] text-muted-foreground">{perm.key}</div>
                                                </td>
                                                {matrix.map((role) => (
                                                    <td key={`${role.id}-${perm.key}`} className="border border-border p-1 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-border text-primary focus:ring-ring"
                                                            checked={(selections[role.id] || []).includes(perm.key)}
                                                            onChange={() => togglePerm(role.id, perm.key)}
                                                            disabled={!canManageRoles}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 text-xs text-muted-foreground shadow-xs">
                        <p className="font-semibold text-foreground">Modularidad</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>Catalogo de permisos centralizado en backend.</li>
                            <li>Roles por tenant; roles de sistema no se eliminan.</li>
                            <li>Politicas y abort_unless usan el mismo conjunto de claves.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function RoleColumnHeader({ role, canManageRoles, onSavePermissions }) {
    const form = useForm({
        name: role.name,
        description: role.description ?? '',
    });

    useEffect(() => {
        form.setData({
            name: role.name,
            description: role.description ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar al recargar props Inertia
    }, [role.id, role.name, role.description]);

    const submitMeta = (e) => {
        e.preventDefault();
        form.patch(route('team.roles.update', role.id), { preserveScroll: true });
    };

    const destroy = () => {
        if (
            !confirm(
                '¿Eliminar este rol personalizado? Solo es posible si no hay usuarios con este rol asignado.',
            )
        ) {
            return;
        }
        router.delete(route('team.roles.destroy', role.id), { preserveScroll: true });
    };

    return (
        <div className="flex flex-col gap-2 text-xs">
            {canManageRoles && !role.is_system && (
                <form className="space-y-1" onSubmit={submitMeta}>
                    <div>
                        <InputLabel value="Nombre" className="text-[10px]" />
                        <TextInput
                            className="mt-0.5 w-full text-xs"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                        />
                        <InputError message={form.errors.name} className="mt-0.5" />
                    </div>
                    <div>
                        <InputLabel value="Descripcion" className="text-[10px]" />
                        <textarea
                            className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                            rows={2}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                        />
                        <InputError message={form.errors.description} className="mt-0.5" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <PrimaryButton
                            type="button"
                            className="justify-center text-[10px]"
                            onClick={onSavePermissions}
                        >
                            Guardar permisos
                        </PrimaryButton>
                        <PrimaryButton
                            type="submit"
                            className="justify-center text-[10px]"
                            disabled={form.processing}
                        >
                            Actualizar rol
                        </PrimaryButton>
                        <DangerButton type="button" className="justify-center text-[10px]" onClick={destroy}>
                            Eliminar
                        </DangerButton>
                    </div>
                </form>
            )}

            {canManageRoles && role.is_system && (
                <form className="space-y-1" onSubmit={submitMeta}>
                    <div className="text-center">
                        <div className="font-semibold text-foreground">{role.name}</div>
                        <div className="font-normal text-muted-foreground">{role.slug}</div>
                        <span className="text-[10px] text-amber-700">sistema</span>
                    </div>
                    <div>
                        <InputLabel value="Descripcion" className="text-[10px]" />
                        <textarea
                            className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                            rows={2}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                        />
                        <InputError message={form.errors.description} className="mt-0.5" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <PrimaryButton
                            type="button"
                            className="justify-center text-[10px]"
                            onClick={onSavePermissions}
                        >
                            Guardar permisos
                        </PrimaryButton>
                        <PrimaryButton
                            type="submit"
                            className="justify-center text-[10px]"
                            disabled={form.processing}
                        >
                            Actualizar descripcion
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {!canManageRoles && (
                <div className="text-center">
                    <div className="font-semibold text-foreground">{role.name}</div>
                    <div className="font-normal text-muted-foreground">{role.slug}</div>
                    {role.is_system && <span className="text-[10px] text-amber-700">sistema</span>}
                </div>
            )}
        </div>
    );
}
