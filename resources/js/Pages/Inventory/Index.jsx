import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Inventario inteligente
                </h2>
            }
        >
            <Head title="Inventario" />

            <div className="py-8">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-lg bg-white p-6 shadow-xs">
                            <p className="mb-3 text-sm text-gray-500">
                                Sucursal activa: #{activeBranchId}
                            </p>
                            <form
                                className="mb-4 grid gap-2 sm:grid-cols-3"
                                onSubmit={applyFilters}
                            >
                                <TextInput
                                    className="w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por SKU o nombre"
                                />
                                <select
                                    className="rounded-md border-gray-300"
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
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Stock por producto
                            </h3>
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
                                            className={`flex items-center justify-between rounded border p-3 ${
                                                isLow
                                                    ? 'border-amber-300 bg-amber-50'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {product.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    SKU {product.sku} | Stock {product.quantity_on_hand}{' '}
                                                    {product.unit} | Min {threshold}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
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

                        <div className="rounded-lg bg-white p-6 shadow-xs">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Alertas abiertas
                            </h3>
                            <div className="space-y-2">
                                {alerts.length === 0 ? (
                                    <p className="text-sm text-gray-600">Sin alertas abiertas.</p>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-3"
                                        >
                                            <div>
                                                <p className="font-medium text-red-800">
                                                    Producto #{alert.product_id} - {alert.severity}
                                                </p>
                                                <p className="text-sm text-red-700">
                                                    Stock actual {alert.current_stock} | Min {alert.threshold}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
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

                        <div className="rounded-lg bg-white p-6 shadow-xs">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Ultimos movimientos (kardex)
                            </h3>
                            <p className="mb-2 text-xs text-gray-500">
                                {movementSummary}
                            </p>
                            <div className="space-y-2 text-sm">
                                {movements.data.length === 0 ? (
                                    <p className="text-gray-600">Sin movimientos.</p>
                                ) : (
                                    movements.data.map((movement) => (
                                        <div key={movement.id} className="rounded border p-2">
                                            #{movement.id} | Producto #{movement.product_id} |{' '}
                                            {movement.type} | Delta {movement.quantity_delta} | Saldo{' '}
                                            {movement.balance_after}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                                    disabled={movements.current_page <= 1}
                                    onClick={() => goToMovementPage(movements.current_page - 1)}
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
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
                                <div className="rounded-lg bg-white p-6 shadow-xs">
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                                        Ajuste de inventario
                                    </h3>
                                    <form className="space-y-3" onSubmit={submitAdjust}>
                                        <div>
                                            <InputLabel
                                                htmlFor="adjust_product_id"
                                                value="Producto ID"
                                            />
                                            <TextInput
                                                id="adjust_product_id"
                                                className="mt-1 block w-full"
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
                                            />
                                            <TextInput
                                                id="new_quantity"
                                                className="mt-1 block w-full"
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
                                            <InputLabel htmlFor="reason" value="Motivo" />
                                            <TextInput
                                                id="reason"
                                                className="mt-1 block w-full"
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

                                <div className="rounded-lg bg-white p-6 shadow-xs">
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                                        Politica de alertas
                                    </h3>
                                    <form className="space-y-3" onSubmit={submitPolicy}>
                                        <div>
                                            <InputLabel
                                                htmlFor="policy_product_id"
                                                value="Producto ID"
                                            />
                                            <TextInput
                                                id="policy_product_id"
                                                className="mt-1 block w-full"
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
                                            />
                                            <TextInput
                                                id="min_threshold"
                                                className="mt-1 block w-full"
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
                                            />
                                            <TextInput
                                                id="cooldown_minutes"
                                                className="mt-1 block w-full"
                                                value={policyForm.data.cooldown_minutes}
                                                onChange={(e) =>
                                                    policyForm.setData(
                                                        'cooldown_minutes',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
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
