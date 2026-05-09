import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

/** Misma envoltura que `Dashboard.jsx` (blanco / slate-900 en oscuro). */
const shell =
    'rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900 sm:p-5';
const inner =
    'rounded-lg border border-gray-100 bg-gray-50/80 dark:border-slate-700 dark:bg-slate-800/50';
const innerAmber =
    'rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50';
const innerRed =
    'rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/60';
const sectionLabel =
    'text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500';
const cardTitle = 'text-sm font-semibold text-gray-900 dark:text-slate-100';
const labelForm = 'text-gray-700 dark:text-slate-300';
const inputOnCard =
    'mt-1 block w-full border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
/** Sin mt-1 (misma fila que select / boton en el grid de filtros). */
const inputFilter =
    'block w-full border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
const selectOnCard =
    'min-h-[44px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:min-h-0';
const btnSecondary =
    'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export default function InventoryIndex({
    products,
    alerts,
    movements,
    filters,
    activeBranchId,
    canManage,
}) {
    const [search, setSearch] = useState(filters?.q ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');

    const adjustForm = useForm({
        product_id: '',
        new_quantity: '',
        reason: '',
    });

    const policyForm = useForm({
        product_id: '',
        min_threshold: 10,
        is_alert_enabled: true,
        cooldown_minutes: 60,
    });

    const submitAdjust = (e) => {
        e.preventDefault();
        if (!adjustForm.data.product_id) return;

        adjustForm.post(route('inventory.adjust', adjustForm.data.product_id), {
            preserveScroll: true,
            onSuccess: () => adjustForm.reset('new_quantity', 'reason'),
        });
    };

    const submitPolicy = (e) => {
        e.preventDefault();
        if (!policyForm.data.product_id) return;

        policyForm.patch(route('inventory.policy.update', policyForm.data.product_id), {
            preserveScroll: true,
        });
    };

    const selectProductForForms = (product) => {
        adjustForm.setData((prev) => ({
            ...prev,
            product_id: product.id,
        }));
        policyForm.setData({
            product_id: product.id,
            min_threshold: product.policy?.min_threshold ?? 10,
            is_alert_enabled: product.policy?.is_alert_enabled ?? true,
            cooldown_minutes: product.policy?.cooldown_minutes ?? 60,
        });
    };

    const acknowledgeAlert = (alertId) => {
        router.post(route('inventory.alerts.ack', alertId), {}, { preserveScroll: true });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            route('inventory.page'),
            {
                q: search,
                status,
            },
            { preserveScroll: true },
        );
    };

    const goToMovementPage = (page) => {
        router.get(
            route('inventory.page'),
            {
                q: filters?.q ?? '',
                status: filters?.status ?? 'all',
                page,
            },
            { preserveScroll: true },
        );
    };

    const movementSummary = useMemo(() => {
        if (!movements?.total) return 'Sin movimientos';
        return `Pagina ${movements.current_page} de ${movements.last_page} (${movements.total} registros)`;
    }, [movements]);

    return (
        <AuthenticatedLayout>
            <Head title="Inventario" />

            <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                        Inventario inteligente
                    </h1>
                    <p className="mt-1 text-sm font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        Sucursal activa · #{activeBranchId}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className={shell}>
                            <p className={`${sectionLabel} mb-4`}>Filtros</p>
                            <form
                                className="mb-6 grid gap-2 sm:grid-cols-3"
                                onSubmit={applyFilters}
                            >
                                <TextInput
                                    className={inputFilter}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por SKU o nombre"
                                />
                                <select
                                    className={selectOnCard}
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    <option value="ok">Stock normal</option>
                                    <option value="low">Bajo stock</option>
                                    <option value="critical">Critico</option>
                                </select>
                                <PrimaryButton>Aplicar filtros</PrimaryButton>
                            </form>
                            <h3 className={`${cardTitle} mb-3`}>Stock por producto</h3>
                            <div className="space-y-2">
                                {products.map((product) => {
                                    const threshold = Number(
                                        product.policy?.min_threshold ?? 10,
                                    );
                                    const stock = Number(product.quantity_on_hand);
                                    const isLow = stock <= threshold;

                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex items-center justify-between p-3 ${
                                                isLow ? innerAmber : inner
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-slate-100">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                                    SKU {product.sku} | Stock {product.quantity_on_hand}{' '}
                                                    {product.unit} | Min {threshold}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    className={btnSecondary}
                                                    onClick={() => selectProductForForms(product)}
                                                >
                                                    Gestionar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={shell}>
                            <h3 className={`${cardTitle} mb-4`}>Alertas abiertas</h3>
                            <div className="space-y-2">
                                {alerts.length === 0 ? (
                                    <p className="text-sm text-gray-600 dark:text-slate-400">
                                        Sin alertas abiertas.
                                    </p>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`flex items-center justify-between p-3 ${innerRed}`}
                                        >
                                            <div>
                                                <p className="font-medium text-red-800 dark:text-red-200">
                                                    Producto #{alert.product_id} - {alert.severity}
                                                </p>
                                                <p className="text-xs text-red-700 dark:text-red-300">
                                                    Stock actual {alert.current_stock} | Min{' '}
                                                    {alert.threshold}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    className={`${btnSecondary} border-red-300 text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60`}
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    Atender
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={shell}>
                            <h3 className={`${cardTitle} mb-2`}>Ultimos movimientos (kardex)</h3>
                            <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">
                                {movementSummary}
                            </p>
                            <div className="space-y-2 text-sm text-gray-800 dark:text-slate-200">
                                {movements.data.length === 0 ? (
                                    <p className="text-gray-600 dark:text-slate-400">
                                        Sin movimientos.
                                    </p>
                                ) : (
                                    movements.data.map((movement) => (
                                        <div
                                            key={movement.id}
                                            className={`${inner} p-2 text-xs sm:text-sm`}
                                        >
                                            #{movement.id} | Producto #{movement.product_id} |{' '}
                                            {movement.type} | Delta {movement.quantity_delta} | Saldo{' '}
                                            {movement.balance_after}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    className={btnSecondary}
                                    disabled={movements.current_page <= 1}
                                    onClick={() => goToMovementPage(movements.current_page - 1)}
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    className={btnSecondary}
                                    disabled={movements.current_page >= movements.last_page}
                                    onClick={() => goToMovementPage(movements.current_page + 1)}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {canManage && (
                            <>
                                <div className={shell}>
                                    <p className={`${sectionLabel} mb-4`}>Ajustes</p>
                                    <h3 className={`${cardTitle} mb-4`}>Ajuste de inventario</h3>
                                    <form className="space-y-3" onSubmit={submitAdjust}>
                                        <div>
                                            <InputLabel
                                                htmlFor="adjust_product_id"
                                                value="Producto ID"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="adjust_product_id"
                                                className={inputOnCard}
                                                value={adjustForm.data.product_id}
                                                onChange={(e) =>
                                                    adjustForm.setData(
                                                        'product_id',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="new_quantity"
                                                value="Nuevo stock"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="new_quantity"
                                                className={inputOnCard}
                                                value={adjustForm.data.new_quantity}
                                                onChange={(e) =>
                                                    adjustForm.setData(
                                                        'new_quantity',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={adjustForm.errors.new_quantity}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="reason"
                                                value="Motivo"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="reason"
                                                className={inputOnCard}
                                                value={adjustForm.data.reason}
                                                onChange={(e) =>
                                                    adjustForm.setData('reason', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={adjustForm.errors.reason}
                                            />
                                        </div>
                                        <PrimaryButton disabled={adjustForm.processing}>
                                            Ajustar stock
                                        </PrimaryButton>
                                    </form>
                                </div>

                                <div className={shell}>
                                    <p className={`${sectionLabel} mb-4`}>Politicas</p>
                                    <h3 className={`${cardTitle} mb-4`}>Politica de alertas</h3>
                                    <form className="space-y-3" onSubmit={submitPolicy}>
                                        <div>
                                            <InputLabel
                                                htmlFor="policy_product_id"
                                                value="Producto ID"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="policy_product_id"
                                                className={inputOnCard}
                                                value={policyForm.data.product_id}
                                                onChange={(e) =>
                                                    policyForm.setData(
                                                        'product_id',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="min_threshold"
                                                value="Umbral minimo"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="min_threshold"
                                                className={inputOnCard}
                                                value={policyForm.data.min_threshold}
                                                onChange={(e) =>
                                                    policyForm.setData(
                                                        'min_threshold',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="cooldown_minutes"
                                                value="Cooldown minutos"
                                                className={labelForm}
                                            />
                                            <TextInput
                                                id="cooldown_minutes"
                                                className={inputOnCard}
                                                value={policyForm.data.cooldown_minutes}
                                                onChange={(e) =>
                                                    policyForm.setData(
                                                        'cooldown_minutes',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-slate-100">
                                            <input
                                                type="checkbox"
                                                checked={policyForm.data.is_alert_enabled}
                                                onChange={(e) =>
                                                    policyForm.setData(
                                                        'is_alert_enabled',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            Alertas habilitadas
                                        </label>
                                        <PrimaryButton disabled={policyForm.processing}>
                                            Guardar politica
                                        </PrimaryButton>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
