import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/Components/ui/command';
import { Separator } from '@/Components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/Components/ui/sheet';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function TransfersIndex({
    transfers,
    branches,
    products,
    canManage,
    activeBranchId,
}) {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Transferencias entre sucursales
                    </h2>
                    {canManage && (
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm">
                                    <Plus className="size-4" />
                                    Nueva transferencia
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-full overflow-y-auto sm:max-w-2xl"
                            >
                                <SheetHeader>
                                    <SheetTitle>Nueva transferencia de stock</SheetTitle>
                                    <SheetDescription>
                                        Mueve productos de una sucursal a otra. El stock se
                                        descuenta del origen y se agrega al destino al guardar.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="px-4 pb-4">
                                    <NewTransferForm
                                        branches={branches}
                                        products={products}
                                        activeBranchId={activeBranchId}
                                        onSuccess={() => setSheetOpen(false)}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
            }
        >
            <Head title="Transferencias" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Últimas {transfers.length} transferencias
                            </p>
                        </div>

                        {transfers.length === 0 ? (
                            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                Aún no hay transferencias.
                                {canManage && ' Crea la primera desde el botón superior.'}
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                                {transfers.map((transfer) => (
                                    <TransferRow key={transfer.id} transfer={transfer} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function TransferRow({ transfer }) {
    const [expanded, setExpanded] = useState(false);

    const itemsLabel =
        transfer.items.length === 1 ? '1 producto' : `${transfer.items.length} productos`;

    return (
        <div className="flex flex-col gap-2 p-4">
            <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                        #{transfer.id}
                    </Badge>
                    {transfer.reference && (
                        <Badge variant="secondary" className="text-[10px]">
                            {transfer.reference}
                        </Badge>
                    )}
                    <span className="text-sm font-medium text-foreground">
                        {transfer.source_branch?.name ?? '—'}
                    </span>
                    <ArrowRight
                        className="size-3 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-foreground">
                        {transfer.destination_branch?.name ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{itemsLabel}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    {transfer.completed_at
                        ? new Date(transfer.completed_at).toLocaleString('es-MX', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                          })
                        : '—'}
                </div>
            </button>

            {expanded && (
                <div className="ml-1 mt-2 space-y-2 border-l-2 border-border pl-4">
                    <p className="text-xs text-muted-foreground">
                        Por: {transfer.user?.name ?? '—'}
                    </p>
                    {transfer.reason && (
                        <p className="text-xs text-muted-foreground">
                            Motivo: {transfer.reason}
                        </p>
                    )}
                    <div className="rounded-md border border-border bg-muted/30">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Producto
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">SKU</th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Cantidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transfer.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-foreground">
                                            {item.product_name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {item.product_sku ?? '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function NewTransferForm({ branches, products, activeBranchId, onSuccess }) {
    const form = useForm({
        source_branch_id: String(activeBranchId ?? ''),
        destination_branch_id: '',
        reference: '',
        reason: '',
        items: [],
    });

    const [selectedProductId, setSelectedProductId] = useState('');
    const [pendingQuantity, setPendingQuantity] = useState('1');
    const [productSearch, setProductSearch] = useState('');

    const itemsByProduct = useMemo(() => {
        const map = new Map();
        for (const item of form.data.items) {
            map.set(String(item.product_id), item);
        }
        return map;
    }, [form.data.items]);

    const addItem = () => {
        const productId = Number(selectedProductId);
        const quantity = Number(pendingQuantity);

        if (!productId || quantity <= 0) return;
        if (itemsByProduct.has(String(productId))) {
            form.setData(
                'items',
                form.data.items.map((it) =>
                    Number(it.product_id) === productId
                        ? { ...it, quantity: Number(it.quantity) + quantity }
                        : it,
                ),
            );
        } else {
            const product = products.find((p) => p.id === productId);
            form.setData('items', [
                ...form.data.items,
                {
                    product_id: productId,
                    product_name: product?.name ?? '',
                    product_sku: product?.sku ?? '',
                    quantity,
                },
            ]);
        }

        setSelectedProductId('');
        setPendingQuantity('1');
        setProductSearch('');
    };

    const removeItem = (productId) => {
        form.setData(
            'items',
            form.data.items.filter(
                (it) => Number(it.product_id) !== Number(productId),
            ),
        );
    };

    const submit = (e) => {
        e.preventDefault();

        if (form.data.items.length === 0) return;

        const payload = {
            source_branch_id: Number(form.data.source_branch_id),
            destination_branch_id: Number(form.data.destination_branch_id),
            reference: form.data.reference || null,
            reason: form.data.reason || null,
            items: form.data.items.map((it) => ({
                product_id: Number(it.product_id),
                quantity: Number(it.quantity),
            })),
        };

        form.transform(() => payload).post(route('inventory.transfers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('source_branch_id', String(activeBranchId ?? ''));
                onSuccess?.();
            },
        });
    };

    const sourceBranchId = Number(form.data.source_branch_id);
    const destinationBranches = branches.filter((b) => b.id !== sourceBranchId);

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <InputLabel htmlFor="source_branch_id" value="Sucursal origen" />
                    <select
                        id="source_branch_id"
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        value={form.data.source_branch_id}
                        onChange={(e) =>
                            form.setData('source_branch_id', e.target.value)
                        }
                        required
                    >
                        <option value="">Selecciona</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                                {b.is_main ? ' (Matriz)' : ''}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-1" message={form.errors.source_branch_id} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="destination_branch_id"
                        value="Sucursal destino"
                    />
                    <select
                        id="destination_branch_id"
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                        value={form.data.destination_branch_id}
                        onChange={(e) =>
                            form.setData('destination_branch_id', e.target.value)
                        }
                        required
                    >
                        <option value="">Selecciona</option>
                        {destinationBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                                {b.is_main ? ' (Matriz)' : ''}
                            </option>
                        ))}
                    </select>
                    <InputError
                        className="mt-1"
                        message={form.errors.destination_branch_id}
                    />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="reference" value="Referencia (opcional)" />
                <TextInput
                    id="reference"
                    className="mt-1 block w-full"
                    value={form.data.reference}
                    onChange={(e) => form.setData('reference', e.target.value)}
                    placeholder="Ej. REM-001"
                    maxLength={60}
                />
                <InputError className="mt-1" message={form.errors.reference} />
            </div>

            <div>
                <InputLabel htmlFor="reason" value="Motivo (opcional)" />
                <TextInput
                    id="reason"
                    className="mt-1 block w-full"
                    value={form.data.reason}
                    onChange={(e) => form.setData('reason', e.target.value)}
                    placeholder="Ej. Reabastecimiento sucursal Sur"
                />
                <InputError className="mt-1" message={form.errors.reason} />
            </div>

            <Separator />

            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Productos a transferir
                </p>

                <div className="rounded-md border border-border bg-background">
                    <Command>
                        <CommandInput
                            placeholder="Buscar producto por nombre o SKU..."
                            value={productSearch}
                            onValueChange={setProductSearch}
                        />
                        <CommandList className="max-h-40">
                            {productSearch.length > 0 && (
                                <CommandEmpty>Sin resultados.</CommandEmpty>
                            )}
                            <CommandGroup>
                                {products.map((p) => (
                                    <CommandItem
                                        key={p.id}
                                        value={`${p.name} ${p.sku}`}
                                        onSelect={() => {
                                            setSelectedProductId(String(p.id));
                                            setProductSearch('');
                                        }}
                                    >
                                        <div className="flex flex-1 items-center justify-between">
                                            <span className="text-sm">{p.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {p.sku}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>

                {selectedProductId && (
                    <div className="mt-2 flex items-end gap-2">
                        <div className="flex-1">
                            <Badge variant="secondary" className="w-full justify-start py-1.5">
                                {products.find((p) => String(p.id) === selectedProductId)?.name}
                            </Badge>
                        </div>
                        <div>
                            <InputLabel htmlFor="pending_qty" value="Cantidad" />
                            <TextInput
                                id="pending_qty"
                                type="number"
                                min="0.001"
                                step="0.001"
                                className="mt-1 w-24"
                                value={pendingQuantity}
                                onChange={(e) => setPendingQuantity(e.target.value)}
                            />
                        </div>
                        <Button type="button" onClick={addItem}>
                            Agregar
                        </Button>
                    </div>
                )}

                {form.data.items.length > 0 && (
                    <div className="mt-3 rounded-md border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Producto
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Cantidad
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {form.data.items.map((item) => (
                                    <tr key={item.product_id}>
                                        <td className="px-3 py-2">
                                            <p className="font-medium text-foreground">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.product_sku}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {item.quantity}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => removeItem(item.product_id)}
                                                aria-label={`Quitar ${item.product_name}`}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <InputError className="mt-2" message={form.errors.items} />
                {form.errors['items.0.product_id'] && (
                    <InputError
                        className="mt-1"
                        message={form.errors['items.0.product_id']}
                    />
                )}
            </div>

            <Separator />

            <Button
                type="submit"
                disabled={
                    form.processing ||
                    form.data.items.length === 0 ||
                    !form.data.source_branch_id ||
                    !form.data.destination_branch_id
                }
            >
                Ejecutar transferencia
            </Button>
        </form>
    );
}
