import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';

const inputClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500';

const branchFields = {
    name: '',
    branch_site_kind: 'standalone',
    parent_branch_id: '',
    site_location_detail: '',
    code: '',
    city: '',
    state: '',
    postal_code: '',
    address: '',
    neighborhood: '',
    municipality: '',
    address_references: '',
    phone: '',
    rfc: '',
};

function kindBadgeClass(value) {
    if (value === 'mall_island') {
        return 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-100';
    }
    if (value === 'transit_kiosk') {
        return 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-100';
}

export default function BranchesIndex({
    branches,
    canManage,
    tenant,
    branchSiteKindOptions = [],
    parentBranchOptions = [],
}) {
    const branchRows = branches?.data ?? [];

    const createForm = useForm(branchFields);

    const updateForm = useForm({
        ...branchFields,
        id: null,
        is_active: true,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('branches.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEdit = (branch) => {
        updateForm.setData({
            id: branch.id,
            name: branch.name ?? '',
            branch_site_kind: branch.branch_site_kind ?? 'standalone',
            parent_branch_id: branch.parent_branch_id ?? '',
            site_location_detail: branch.site_location_detail ?? '',
            code: branch.code ?? '',
            city: branch.city ?? '',
            state: branch.state ?? '',
            postal_code: branch.postal_code ?? '',
            address: branch.address ?? '',
            neighborhood: branch.neighborhood ?? '',
            municipality: branch.municipality ?? '',
            address_references: branch.address_references ?? '',
            phone: branch.phone ?? '',
            rfc: branch.rfc ?? '',
            is_active: branch.is_active,
        });
    };

    const kindLabel = (value) =>
        branchSiteKindOptions.find((o) => o.value === value)?.label ?? value;

    const parentChoicesEdit = parentBranchOptions.filter((p) => p.id !== updateForm.data.id);

    const submitUpdate = (e) => {
        e.preventDefault();
        updateForm.patch(route('branches.update', updateForm.data.id), {
            preserveScroll: true,
            onSuccess: () => updateForm.reset(),
        });
    };

    const formatBranchLines = (branch) => {
        const parts = [];
        if (branch.address) {
            parts.push(branch.address);
        }
        const locality = [branch.neighborhood, branch.municipality, branch.city]
            .filter(Boolean)
            .join(', ');
        if (locality) {
            parts.push(locality);
        }
        const geo = [branch.state, branch.postal_code ? `CP ${branch.postal_code}` : '']
            .filter(Boolean)
            .join(' · ');
        if (geo) {
            parts.push(geo);
        }
        return parts;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-slate-100">
                    Tiendas y ubicaciones
                </h2>
            }
        >
            <Head title="Ubicaciones" />
            <div className="py-8">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden bg-white shadow-xs dark:bg-slate-900/80 sm:rounded-lg dark:ring-1 dark:ring-slate-700">
                            <div className="p-6">
                                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                                    Negocio: {tenant?.name}
                                </h3>
                                <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
                                    {tenant?.country_code} | {tenant?.currency_code} |{' '}
                                    {tenant?.timezone}
                                </p>
                                <div className="space-y-3">
                                    {branchRows.length === 0 ? (
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            Aún no registras tiendas o puntos de venta.
                                        </p>
                                    ) : (
                                        branchRows.map((branch) => (
                                            <div
                                                key={branch.id}
                                                className="rounded border border-gray-200 p-4 dark:border-slate-600 dark:bg-slate-800/40"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-medium text-gray-900">
                                                                {branch.name}{' '}
                                                                {branch.is_main ? '(Matriz)' : ''}
                                                                {branch.code ? (
                                                                    <span className="text-sm font-normal text-gray-500">
                                                                        {' '}
                                                                        · código {branch.code}
                                                                    </span>
                                                                ) : null}
                                                            </p>
                                                            <span
                                                                className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${kindBadgeClass(branch.branch_site_kind)}`}
                                                            >
                                                                {kindLabel(branch.branch_site_kind)}
                                                            </span>
                                                        </div>
                                                        {branch.parent_branch ? (
                                                            <p className="text-sm text-indigo-800">
                                                                Punto ancla / plaza:{' '}
                                                                <span className="font-medium">
                                                                    {branch.parent_branch.name}
                                                                </span>
                                                            </p>
                                                        ) : null}
                                                        {branch.site_location_detail ? (
                                                            <p className="text-sm text-gray-700">
                                                                Ubicación en sitio:{' '}
                                                                {branch.site_location_detail}
                                                            </p>
                                                        ) : null}
                                                        <div className="text-sm text-gray-700">
                                                            {formatBranchLines(branch).map(
                                                                (line, i) => (
                                                                    <div key={i}>{line}</div>
                                                                ),
                                                            )}
                                                            {branch.address_references ? (
                                                                <div className="mt-1 text-gray-600">
                                                                    Ref: {branch.address_references}
                                                                </div>
                                                            ) : null}
                                                            {branch.phone ? (
                                                                <div className="mt-1">
                                                                    Tel. {branch.phone}
                                                                </div>
                                                            ) : null}
                                                            {branch.rfc ? (
                                                                <div className="mt-1 text-gray-600">
                                                                    RFC {branch.rfc}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {branch.is_active ? 'Activa' : 'Inactiva'}
                                                        </p>
                                                    </div>
                                                    {canManage && (
                                                        <div className="flex shrink-0 gap-2">
                                                            <button
                                                                type="button"
                                                                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                                                                onClick={() =>
                                                                    router.patch(
                                                                        route(
                                                                            'active-branch.update',
                                                                            branch.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                Activar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                                                                onClick={() => startEdit(branch)}
                                                            >
                                                                Editar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Pagination className="mt-6" resource={branches} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {canManage && (
                            <div className="overflow-hidden bg-white shadow-xs dark:bg-slate-900/80 sm:rounded-lg dark:ring-1 dark:ring-slate-700">
                                <form onSubmit={submitCreate} className="space-y-4 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                        Nueva tienda o punto de venta
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        <strong>Islas y módulos:</strong> cada punto sigue siendo una
                                        sucursal operativa (inventario y caja propios). Elige el tipo;
                                        las islas en plaza o módulos en metro pueden colgar de una
                                        sucursal “ancla” (tienda principal en el mismo centro). Para
                                        rutas y paquetería, captura calle y número, colonia, municipio y
                                        CP (orden SEPOMEX).
                                    </p>

                                    <div>
                                        <InputLabel htmlFor="branch_site_kind" value="Tipo de punto *" />
                                        <select
                                            id="branch_site_kind"
                                            className={inputClass}
                                            value={createForm.data.branch_site_kind}
                                            onChange={(e) =>
                                                createForm.setData('branch_site_kind', e.target.value)
                                            }
                                            required
                                        >
                                            {branchSiteKindOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.branch_site_kind}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="parent_branch_id"
                                            value="Sucursal ancla / plaza (opcional)"
                                        />
                                        <select
                                            id="parent_branch_id"
                                            className={inputClass}
                                            value={createForm.data.parent_branch_id}
                                            onChange={(e) =>
                                                createForm.setData('parent_branch_id', e.target.value)
                                            }
                                        >
                                            <option value="">— Sin ancla (punto independiente) —</option>
                                            {parentBranchOptions.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Solo aparecen sucursales sin padre (anclas). Obligatorio
                                            lógico si operas isla en un centro ya registrado.
                                        </p>
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.parent_branch_id}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="site_location_detail"
                                            value="Ubicación dentro del sitio (opcional)"
                                        />
                                        <textarea
                                            id="site_location_detail"
                                            className={inputClass}
                                            rows={2}
                                            placeholder="Ej. Isla 12 pasillo norte, módulo metro línea B…"
                                            value={createForm.data.site_location_detail}
                                            onChange={(e) =>
                                                createForm.setData('site_location_detail', e.target.value)
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.site_location_detail}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="name" value="Nombre *" />
                                        <TextInput
                                            id="name"
                                            className={inputClass}
                                            value={createForm.data.name}
                                            onChange={(e) =>
                                                createForm.setData('name', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={createForm.errors.name} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="address" value="Calle y número *" />
                                        <textarea
                                            id="address"
                                            className={inputClass}
                                            rows={2}
                                            value={createForm.data.address}
                                            onChange={(e) =>
                                                createForm.setData('address', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={createForm.errors.address} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="neighborhood" value="Colonia" />
                                        <TextInput
                                            id="neighborhood"
                                            className={inputClass}
                                            value={createForm.data.neighborhood}
                                            onChange={(e) =>
                                                createForm.setData('neighborhood', e.target.value)
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.neighborhood}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="municipality"
                                            value="Municipio o alcaldía"
                                        />
                                        <TextInput
                                            id="municipality"
                                            className={inputClass}
                                            value={createForm.data.municipality}
                                            onChange={(e) =>
                                                createForm.setData('municipality', e.target.value)
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.municipality}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="city" value="Ciudad" />
                                        <TextInput
                                            id="city"
                                            className={inputClass}
                                            value={createForm.data.city}
                                            onChange={(e) =>
                                                createForm.setData('city', e.target.value)
                                            }
                                        />
                                        <InputError className="mt-2" message={createForm.errors.city} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="state" value="Estado *" />
                                        <TextInput
                                            id="state"
                                            className={inputClass}
                                            value={createForm.data.state}
                                            onChange={(e) =>
                                                createForm.setData('state', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={createForm.errors.state} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="postal_code" value="Código postal *" />
                                        <TextInput
                                            id="postal_code"
                                            className={inputClass}
                                            inputMode="numeric"
                                            maxLength={5}
                                            value={createForm.data.postal_code}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'postal_code',
                                                    e.target.value.replace(/\D/g, '').slice(0, 5),
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.postal_code}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="address_references"
                                            value="Referencias (opcional)"
                                        />
                                        <textarea
                                            id="address_references"
                                            className={inputClass}
                                            rows={2}
                                            placeholder="Entre calles, color de fachada, etc."
                                            value={createForm.data.address_references}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    'address_references',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={createForm.errors.address_references}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="code" value="Código interno de sucursal" />
                                        <TextInput
                                            id="code"
                                            className={inputClass}
                                            value={createForm.data.code}
                                            onChange={(e) =>
                                                createForm.setData('code', e.target.value)
                                            }
                                        />
                                        <InputError className="mt-2" message={createForm.errors.code} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone" value="Teléfono" />
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            className={inputClass}
                                            value={createForm.data.phone}
                                            onChange={(e) =>
                                                createForm.setData('phone', e.target.value)
                                            }
                                        />
                                        <InputError className="mt-2" message={createForm.errors.phone} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="rfc" value="RFC (opcional)" />
                                        <TextInput
                                            id="rfc"
                                            className={inputClass}
                                            autoCapitalize="characters"
                                            value={createForm.data.rfc}
                                            onChange={(e) =>
                                                createForm.setData('rfc', e.target.value.toUpperCase())
                                            }
                                        />
                                        <InputError className="mt-2" message={createForm.errors.rfc} />
                                    </div>

                                    <PrimaryButton disabled={createForm.processing}>
                                        Guardar sucursal
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        {canManage && updateForm.data.id && (
                            <div className="overflow-hidden bg-white shadow-xs sm:rounded-lg">
                                <form onSubmit={submitUpdate} className="space-y-4 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Editar sucursal
                                    </h3>

                                    <div>
                                        <InputLabel htmlFor="edit-name" value="Nombre *" />
                                        <TextInput
                                            id="edit-name"
                                            className={inputClass}
                                            value={updateForm.data.name}
                                            onChange={(e) =>
                                                updateForm.setData('name', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={updateForm.errors.name} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-branch_site_kind" value="Tipo de punto *" />
                                        <select
                                            id="edit-branch_site_kind"
                                            className={inputClass}
                                            value={updateForm.data.branch_site_kind}
                                            onChange={(e) =>
                                                updateForm.setData('branch_site_kind', e.target.value)
                                            }
                                            required
                                        >
                                            {branchSiteKindOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-2"
                                            message={updateForm.errors.branch_site_kind}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="edit-parent_branch_id"
                                            value="Sucursal ancla / plaza (opcional)"
                                        />
                                        <select
                                            id="edit-parent_branch_id"
                                            className={inputClass}
                                            value={updateForm.data.parent_branch_id}
                                            onChange={(e) =>
                                                updateForm.setData('parent_branch_id', e.target.value)
                                            }
                                        >
                                            <option value="">— Sin ancla —</option>
                                            {parentChoicesEdit.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-2"
                                            message={updateForm.errors.parent_branch_id}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="edit-site_location_detail"
                                            value="Ubicación dentro del sitio"
                                        />
                                        <textarea
                                            id="edit-site_location_detail"
                                            className={inputClass}
                                            rows={2}
                                            value={updateForm.data.site_location_detail}
                                            onChange={(e) =>
                                                updateForm.setData(
                                                    'site_location_detail',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={updateForm.errors.site_location_detail}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-address" value="Calle y número *" />
                                        <textarea
                                            id="edit-address"
                                            className={inputClass}
                                            rows={2}
                                            value={updateForm.data.address}
                                            onChange={(e) =>
                                                updateForm.setData('address', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={updateForm.errors.address} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-neighborhood" value="Colonia" />
                                        <TextInput
                                            id="edit-neighborhood"
                                            className={inputClass}
                                            value={updateForm.data.neighborhood}
                                            onChange={(e) =>
                                                updateForm.setData('neighborhood', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="edit-municipality"
                                            value="Municipio o alcaldía"
                                        />
                                        <TextInput
                                            id="edit-municipality"
                                            className={inputClass}
                                            value={updateForm.data.municipality}
                                            onChange={(e) =>
                                                updateForm.setData('municipality', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-city" value="Ciudad" />
                                        <TextInput
                                            id="edit-city"
                                            className={inputClass}
                                            value={updateForm.data.city}
                                            onChange={(e) =>
                                                updateForm.setData('city', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-state" value="Estado *" />
                                        <TextInput
                                            id="edit-state"
                                            className={inputClass}
                                            value={updateForm.data.state}
                                            onChange={(e) =>
                                                updateForm.setData('state', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError className="mt-2" message={updateForm.errors.state} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-postal_code" value="Código postal *" />
                                        <TextInput
                                            id="edit-postal_code"
                                            className={inputClass}
                                            inputMode="numeric"
                                            maxLength={5}
                                            value={updateForm.data.postal_code}
                                            onChange={(e) =>
                                                updateForm.setData(
                                                    'postal_code',
                                                    e.target.value.replace(/\D/g, '').slice(0, 5),
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={updateForm.errors.postal_code}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-address_references" value="Referencias" />
                                        <textarea
                                            id="edit-address_references"
                                            className={inputClass}
                                            rows={2}
                                            value={updateForm.data.address_references}
                                            onChange={(e) =>
                                                updateForm.setData(
                                                    'address_references',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-code" value="Código interno" />
                                        <TextInput
                                            id="edit-code"
                                            className={inputClass}
                                            value={updateForm.data.code}
                                            onChange={(e) =>
                                                updateForm.setData('code', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-phone" value="Teléfono" />
                                        <TextInput
                                            id="edit-phone"
                                            type="tel"
                                            className={inputClass}
                                            value={updateForm.data.phone}
                                            onChange={(e) =>
                                                updateForm.setData('phone', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="edit-rfc" value="RFC (opcional)" />
                                        <TextInput
                                            id="edit-rfc"
                                            className={inputClass}
                                            value={updateForm.data.rfc}
                                            onChange={(e) =>
                                                updateForm.setData('rfc', e.target.value.toUpperCase())
                                            }
                                        />
                                        <InputError className="mt-2" message={updateForm.errors.rfc} />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="edit-is_active"
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                            checked={updateForm.data.is_active}
                                            onChange={(e) =>
                                                updateForm.setData('is_active', e.target.checked)
                                            }
                                        />
                                        <InputLabel htmlFor="edit-is_active" value="Sucursal activa" />
                                    </div>

                                    <PrimaryButton disabled={updateForm.processing}>
                                        Actualizar
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
