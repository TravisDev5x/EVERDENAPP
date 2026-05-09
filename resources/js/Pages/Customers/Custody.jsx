import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function StatusPill({ customer }) {
    if (customer.anonymized_at) {
        return (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-slate-200 dark:text-slate-950">
                En Custodia
            </span>
        );
    }

    if (customer.marketing_blocked_at) {
        return (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                Marketing bloqueado
            </span>
        );
    }

    if (customer.privacy_accepted_at) {
        return (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-900 dark:bg-green-500/20 dark:text-green-200">
                Consentimiento vigente
            </span>
        );
    }

    return (
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-300">
            Sin consentimiento
        </span>
    );
}

function EvArcoManager({ customer, canManageCustody }) {
    const [editing, setEditing] = useState(false);
    const editForm = useForm({
        name: customer.name ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        tax_id: customer.tax_id ?? '',
        notes: customer.notes ?? '',
    });
    const custodyForm = useForm({
        reason: '',
    });

    const exportCustomer = () => {
        window.open(route('customers.export', customer.id), '_blank', 'noopener,noreferrer');
    };

    const updateCustomer = (e) => {
        e.preventDefault();
        editForm.patch(route('customers.update', customer.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const opposeMarketing = () => {
        router.patch(route('customers.marketing.oppose', customer.id), {}, { preserveScroll: true });
    };

    const acceptPrivacy = () => {
        router.post(route('customers.privacy.accept', customer.id), { source: 'custody-manager' }, { preserveScroll: true });
    };

    const custodyCancel = (e) => {
        e.preventDefault();
        custodyForm.post(route('customers.custody.cancel', customer.id), {
            preserveScroll: true,
            onSuccess: () => custodyForm.reset('reason'),
        });
    };

    const locked = Boolean(customer.anonymized_at);

    return (
        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900/80">
            <div className="border-b border-gray-100 bg-gradient-to-r from-green-950 via-green-900 to-emerald-900 p-4 text-white dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-100/80">
                            Ciclo de la Confianza
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{customer.name}</h3>
                        <p className="mt-1 text-sm text-green-50/80">
                            {customer.email || 'Sin correo'} · {customer.phone || 'Sin telefono'}
                        </p>
                    </div>
                    <StatusPill customer={customer} />
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div className="grid gap-3 text-sm text-gray-700 dark:text-slate-300 sm:grid-cols-3">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500">RFC</p>
                        <p className="font-medium">{customer.tax_id || 'No capturado'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500">Ventas</p>
                        <p className="font-medium">{customer.sales_count ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500">Version aviso</p>
                        <p className="font-medium">{customer.privacy_version || 'No registrada'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <SecondaryButton type="button" onClick={exportCustomer}>
                        Acceso: exportar datos
                    </SecondaryButton>
                    {canManageCustody && !locked ? (
                        <>
                            <SecondaryButton type="button" onClick={() => setEditing((v) => !v)}>
                                Rectificacion: editar
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={opposeMarketing}>
                                Oposicion: bloquear marketing
                            </SecondaryButton>
                            {!customer.privacy_accepted_at ? (
                                <SecondaryButton type="button" onClick={acceptPrivacy}>
                                    Registrar consentimiento
                                </SecondaryButton>
                            ) : null}
                        </>
                    ) : null}
                </div>

                {editing ? (
                    <form className="grid gap-3 rounded-lg border border-gray-200 p-3 dark:border-slate-700" onSubmit={updateCustomer}>
                        <TextInput value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                        <InputError message={editForm.errors.name} />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <TextInput type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} placeholder="Correo" />
                            <TextInput value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} placeholder="Telefono" />
                            <TextInput value={editForm.data.tax_id} onChange={(e) => editForm.setData('tax_id', e.target.value.toUpperCase())} placeholder="RFC" />
                        </div>
                        <PrimaryButton disabled={editForm.processing}>Guardar rectificacion</PrimaryButton>
                    </form>
                ) : null}

                {canManageCustody && !locked ? (
                    <form className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-900/60 dark:bg-red-950/20" onSubmit={custodyCancel}>
                        <p className="text-sm font-semibold text-red-950 dark:text-red-100">
                            Cancelacion ARCO bajo Custodia
                        </p>
                        <p className="mt-1 text-xs text-red-900/75 dark:text-red-200/75">
                            Anonimiza datos personales y conserva relaciones con ventas, pagos y auditoria.
                        </p>
                        <TextInput
                            className="mt-3 block w-full"
                            value={custodyForm.data.reason}
                            onChange={(e) => custodyForm.setData('reason', e.target.value)}
                            placeholder="Motivo documentado de la solicitud"
                        />
                        <InputError className="mt-1" message={custodyForm.errors.reason} />
                        <button
                            type="submit"
                            disabled={custodyForm.processing}
                            className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                        >
                            Aplicar Custodia
                        </button>
                    </form>
                ) : null}
            </div>
        </article>
    );
}

export default function Custody({ customers, filters, canManageCustody, privacyVersion }) {
    const searchForm = useForm({
        q: filters.q ?? '',
    });

    const search = (e) => {
        e.preventDefault();
        router.get(route('customers.custody.page'), { q: searchForm.data.q }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-slate-100">
                    Custodia de clientes
                </h2>
            }
        >
            <Head title="Custodia de clientes" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-2xl border border-green-900/15 bg-white p-6 shadow-xs dark:border-green-500/20 dark:bg-slate-900/80">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-900/70 dark:text-green-300/80">
                            El Ciclo de la Confianza
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
                            Derechos ARCO y consentimiento
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                            Busca clientes finales, exporta sus datos, rectifica informacion, registra oposicion a
                            marketing y aplica Cancelacion mediante Custodia sin romper ventas ni reportes.
                        </p>
                        <p className="mt-3 text-xs text-gray-500 dark:text-slate-500">
                            Version vigente de aviso: {privacyVersion}
                        </p>
                    </section>

                    <form className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-xs dark:bg-slate-900/80 sm:flex-row" onSubmit={search}>
                        <TextInput
                            className="flex-1"
                            value={searchForm.data.q}
                            onChange={(e) => searchForm.setData('q', e.target.value)}
                            placeholder="Buscar por nombre, correo, telefono o RFC"
                        />
                        <PrimaryButton>Buscar</PrimaryButton>
                    </form>

                    <div className="space-y-4">
                        {(customers.data ?? []).length > 0 ? (
                            customers.data.map((customer) => (
                                <EvArcoManager
                                    key={customer.id}
                                    customer={customer}
                                    canManageCustody={canManageCustody}
                                />
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                                Aun no hay clientes bajo Custodia.
                            </div>
                        )}
                    </div>

                    <Pagination resource={customers} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
