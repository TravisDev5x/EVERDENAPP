import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ProductsIndex({ products, canManage }) {
    const rows = products?.data ?? [];
    const createForm = useForm({
        sku: '',
        name: '',
        price: '',
        tax_rate: 0,
        unit: 'pieza',
        initial_branch_quantity: 0,
    });

    const updateForm = useForm({
        id: null,
        name: '',
        price: '',
        tax_rate: '',
        unit: '',
        is_active: true,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () =>
                createForm.reset('sku', 'name', 'price', 'initial_branch_quantity'),
        });
    };

    const startEdit = (product) => {
        updateForm.setData({
            id: product.id,
            name: product.name,
            price: product.price,
            tax_rate: product.tax_rate,
            unit: product.unit,
            is_active: product.is_active,
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        updateForm.patch(route('products.update', updateForm.data.id), {
            preserveScroll: true,
            onSuccess: () => updateForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-slate-100">
                    Catálogo de productos
                </h2>
            }
        >
            <Head title="Catálogo" />

            <div className="py-8">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden bg-white shadow-xs dark:bg-slate-900/80 sm:rounded-lg dark:ring-1 dark:ring-slate-700">
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
                                    Tu catálogo
                                </h3>
                                <div className="space-y-3">
                                    {rows.length === 0 ? (
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            Todavía no hay productos. Agrega el primero desde el panel derecho.
                                        </p>
                                    ) : (
                                        rows.map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-slate-600 dark:bg-slate-800/50"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-slate-400">
                                                        Código: {product.sku} · $
                                                        {product.price} · IVA{' '}
                                                        {product.tax_rate}% · En esta tienda:{' '}
                                                        {product.quantity_at_branch ?? 0} u.
                                                    </p>
                                                </div>
                                                {canManage && (
                                                    <button
                                                        className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        type="button"
                                                        onClick={() =>
                                                            startEdit(product)
                                                        }
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Pagination className="mt-6" resource={products} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {canManage && (
                            <div className="overflow-hidden bg-white shadow-xs dark:bg-slate-900/80 sm:rounded-lg dark:ring-1 dark:ring-slate-700">
                                <form className="p-6" onSubmit={submitCreate}>
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
                                        Nuevo producto
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <InputLabel htmlFor="sku" value="SKU" />
                                            <TextInput
                                                id="sku"
                                                className="mt-1 block w-full"
                                                value={createForm.data.sku}
                                                onChange={(e) =>
                                                    createForm.setData('sku', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={createForm.errors.sku}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="name" value="Nombre" />
                                            <TextInput
                                                id="name"
                                                className="mt-1 block w-full"
                                                value={createForm.data.name}
                                                onChange={(e) =>
                                                    createForm.setData('name', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={createForm.errors.name}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="price" value="Precio" />
                                            <TextInput
                                                id="price"
                                                className="mt-1 block w-full"
                                                value={createForm.data.price}
                                                onChange={(e) =>
                                                    createForm.setData('price', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={createForm.errors.price}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="initial_branch_quantity"
                                                value="Stock inicial (solo esta sucursal)"
                                            />
                                            <TextInput
                                                id="initial_branch_quantity"
                                                className="mt-1 block w-full"
                                                value={createForm.data.initial_branch_quantity}
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'initial_branch_quantity',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                El inventario por sucursal se gestiona tambien en la pantalla de
                                                Inventario.
                                            </p>
                                            <InputError
                                                className="mt-2"
                                                message={createForm.errors.initial_branch_quantity}
                                            />
                                        </div>
                                        <PrimaryButton disabled={createForm.processing}>
                                            Guardar
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        )}

                        {canManage && updateForm.data.id && (
                            <div className="overflow-hidden bg-white shadow-xs dark:bg-slate-900/80 sm:rounded-lg dark:ring-1 dark:ring-slate-700">
                                <form className="p-6" onSubmit={submitUpdate}>
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
                                        Editar producto
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <InputLabel
                                                htmlFor="edit-name"
                                                value="Nombre"
                                            />
                                            <TextInput
                                                id="edit-name"
                                                className="mt-1 block w-full"
                                                value={updateForm.data.name}
                                                onChange={(e) =>
                                                    updateForm.setData('name', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="edit-price"
                                                value="Precio"
                                            />
                                            <TextInput
                                                id="edit-price"
                                                className="mt-1 block w-full"
                                                value={updateForm.data.price}
                                                onChange={(e) =>
                                                    updateForm.setData('price', e.target.value)
                                                }
                                            />
                                        </div>
                                        <PrimaryButton disabled={updateForm.processing}>
                                            Actualizar
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
