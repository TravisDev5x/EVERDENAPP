import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm, usePage } from '@inertiajs/react';

export default function CashRegistersIndex({ cashRegisters, activeBranchId, canManage }) {
    const { errors } = usePage().props;

    const createForm = useForm({
        name: '',
        code: '',
        is_active: true,
        sort_order: 0,
    });

    const updateForm = useForm({
        id: null,
        name: '',
        code: '',
        is_active: true,
        sort_order: 0,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('cash-registers.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEdit = (row) => {
        updateForm.setData({
            id: row.id,
            name: row.name ?? '',
            code: row.code ?? '',
            is_active: row.is_active,
            sort_order: row.sort_order ?? 0,
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        updateForm.patch(route('cash-registers.update', updateForm.data.id), {
            preserveScroll: true,
            onSuccess: () => updateForm.reset(),
        });
    };

    const destroy = (row) => {
        if (
            !window.confirm(
                `¿Eliminar la caja "${row.name}"? No debe tener sesión abierta y debe quedar otra caja en la sucursal.`,
            )
        ) {
            return;
        }
        router.delete(route('cash-registers.destroy', row.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Cajas registradoras
                </h2>
            }
        >
            <Head title="Cajas registradoras" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <p className="text-sm text-muted-foreground">
                            Cajas de la sucursal activa (#{activeBranchId}). Los cobros en punto de venta usan una de
                            estas cajas.
                        </p>
                        {errors?.delete && (
                            <p className="mt-2 text-sm font-medium text-destructive">{errors.delete}</p>
                        )}
                    </div>

                    {canManage && (
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <h3 className="mb-3 text-lg font-semibold text-foreground">Nueva caja</h3>
                            <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitCreate}>
                                <div className="sm:col-span-2">
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
                                    <InputLabel value="Código interno (opcional)" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        placeholder="Ej. caja-2"
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                    />
                                    <InputError className="mt-1" message={createForm.errors.code} />
                                </div>
                                <div>
                                    <InputLabel value="Orden" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 w-full"
                                        min={0}
                                        value={createForm.data.sort_order}
                                        onChange={(e) =>
                                            createForm.setData('sort_order', parseInt(e.target.value, 10) || 0)
                                        }
                                    />
                                    <InputError className="mt-1" message={createForm.errors.sort_order} />
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2">
                                    <input
                                        id="cr-new-active"
                                        type="checkbox"
                                        checked={createForm.data.is_active}
                                        onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                    />
                                    <label htmlFor="cr-new-active" className="text-sm text-foreground">
                                        Activa
                                    </label>
                                </div>
                                <div className="sm:col-span-2">
                                    <PrimaryButton type="submit" disabled={createForm.processing}>
                                        Crear caja
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="border-b border-border px-6 py-4">
                            <h3 className="text-lg font-semibold text-foreground">Listado</h3>
                        </div>
                        <ul className="divide-y divide-border">
                            {cashRegisters.map((row) => (
                                <li key={row.id} className="px-6 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{row.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Código: {row.code || '—'} · Orden: {row.sort_order} ·{' '}
                                                {row.is_active ? (
                                                    <span className="text-primary">Activa</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Inactiva</span>
                                                )}
                                            </p>
                                        </div>
                                        {canManage && (
                                            <div className="flex flex-wrap gap-2">
                                                <SecondaryButton type="button" onClick={() => startEdit(row)}>
                                                    Editar
                                                </SecondaryButton>
                                                <SecondaryButton type="button" onClick={() => destroy(row)}>
                                                    Eliminar
                                                </SecondaryButton>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {canManage && updateForm.data.id && (
                        <div className="rounded-xl border border-primary/25 bg-primary/5 p-6 shadow-xs">
                            <h3 className="mb-3 text-lg font-semibold text-foreground">Editar caja #{updateForm.data.id}</h3>
                            <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitUpdate}>
                                <div className="sm:col-span-2">
                                    <InputLabel value="Nombre" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        value={updateForm.data.name}
                                        onChange={(e) => updateForm.setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError className="mt-1" message={updateForm.errors.name} />
                                </div>
                                <div>
                                    <InputLabel value="Código interno (opcional)" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        value={updateForm.data.code}
                                        onChange={(e) => updateForm.setData('code', e.target.value)}
                                    />
                                    <InputError className="mt-1" message={updateForm.errors.code} />
                                </div>
                                <div>
                                    <InputLabel value="Orden" />
                                    <TextInput
                                        type="number"
                                        className="mt-1 w-full"
                                        min={0}
                                        value={updateForm.data.sort_order}
                                        onChange={(e) =>
                                            updateForm.setData('sort_order', parseInt(e.target.value, 10) || 0)
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2">
                                    <input
                                        id="cr-edit-active"
                                        type="checkbox"
                                        checked={updateForm.data.is_active}
                                        onChange={(e) => updateForm.setData('is_active', e.target.checked)}
                                    />
                                    <label htmlFor="cr-edit-active" className="text-sm text-foreground">
                                        Activa
                                    </label>
                                </div>
                                <InputError message={updateForm.errors.delete} />
                                <div className="flex flex-wrap gap-2 sm:col-span-2">
                                    <PrimaryButton type="submit" disabled={updateForm.processing}>
                                        Guardar cambios
                                    </PrimaryButton>
                                    <SecondaryButton type="button" onClick={() => updateForm.reset()}>
                                        Cancelar
                                    </SecondaryButton>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
