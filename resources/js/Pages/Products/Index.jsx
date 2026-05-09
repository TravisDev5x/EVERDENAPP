import CategoryManager from '@/Components/CategoryManager';
import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Badge } from '@/Components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/Components/ui/command';
import { Button } from '@/Components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/Components/ui/sheet';
import { Head, router, useForm } from '@inertiajs/react';
import { Tags } from 'lucide-react';
import { useState } from 'react';

function CategorySelector({ categories, value, onChange, error, label = 'Categoría' }) {
    const [search, setSearch] = useState('');
    const selected = categories.find((c) => c.id === value) ?? null;

    return (
        <div>
            <InputLabel value={label + ' (opcional)'} />
            <div className="mt-1 rounded-md border border-gray-300 dark:border-slate-600">
                <Command className="rounded-md">
                    <CommandInput
                        placeholder="Buscar categoría..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-40">
                        {search.length > 0 && (
                            <CommandEmpty>Sin resultados.</CommandEmpty>
                        )}
                        <CommandGroup>
                            <CommandItem
                                value="__none__"
                                onSelect={() => {
                                    onChange(null);
                                    setSearch('');
                                }}
                            >
                                <span className="text-muted-foreground">Sin categoría</span>
                            </CommandItem>
                            {categories.map((cat) => (
                                <CommandItem
                                    key={cat.id}
                                    value={cat.name + ' ' + cat.slug}
                                    onSelect={() => {
                                        onChange(cat.id);
                                        setSearch('');
                                    }}
                                >
                                    <div className="flex flex-1 items-center justify-between">
                                        <span>{cat.name}</span>
                                        {cat.color && (
                                            <span
                                                className="size-3 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
            {selected && (
                <p className="mt-1 text-xs text-muted-foreground">
                    Seleccionada: <span className="font-medium">{selected.name}</span>
                </p>
            )}
            <InputError className="mt-2" message={error} />
        </div>
    );
}

export default function ProductsIndex({ products, canManage, categories = [] }) {
    const rows = products?.data ?? [];
    const createForm = useForm({
        sku: '',
        name: '',
        price: '',
        tax_rate: 0,
        unit: 'pieza',
        initial_branch_quantity: 0,
        category_id: null,
    });

    const updateForm = useForm({
        id: null,
        name: '',
        price: '',
        tax_rate: '',
        unit: '',
        is_active: true,
        category_id: null,
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
            category_id: product.category_id ?? null,
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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Catálogo de productos
                    </h2>
                    {canManage && (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Tags className="size-4" />
                                    Gestionar categorías
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Categorías de productos</SheetTitle>
                                    <SheetDescription>
                                        Crea, edita o elimina categorías. Los cambios se reflejan
                                        automáticamente en el catálogo.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="px-4 pb-4">
                                    <CategoryManager
                                        categories={categories}
                                        canManage={canManage}
                                        onMutate={() => router.reload({ only: ['categories'] })}
                                        compact
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
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
                                                    {product.category && (
                                                        <Badge
                                                            className="mt-1"
                                                            style={
                                                                product.category.color
                                                                    ? {
                                                                          backgroundColor:
                                                                              product.category.color + '20',
                                                                          color: product.category.color,
                                                                          borderColor:
                                                                              product.category.color + '40',
                                                                      }
                                                                    : undefined
                                                            }
                                                            variant="outline"
                                                        >
                                                            {product.category.name}
                                                        </Badge>
                                                    )}
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
                                        <CategorySelector
                                            categories={categories}
                                            value={createForm.data.category_id}
                                            onChange={(id) => createForm.setData('category_id', id)}
                                            error={createForm.errors.category_id}
                                        />
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
                                        <CategorySelector
                                            categories={categories}
                                            value={updateForm.data.category_id}
                                            onChange={(id) => updateForm.setData('category_id', id)}
                                            error={updateForm.errors.category_id}
                                        />
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
