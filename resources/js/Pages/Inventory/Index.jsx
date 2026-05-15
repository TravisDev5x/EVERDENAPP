import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { formatMxn } from '@/lib/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Package, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const CATEGORY_NONE_VALUE = '__none__';

function FormFieldError({ message }) {
    if (!message) {
        return null;
    }
    return (
        <p role="alert" className="text-sm font-medium text-destructive">
            {message}
        </p>
    );
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

export default function InventoryIndex({
    products: productsProp,
    alerts: alertsProp,
    movements: movementsProp,
    filters,
    activeBranchId,
    canManage,
    categories: categoriesProp,
    canCreateProduct = false,
}) {
    const products = asArray(productsProp);
    const alerts = asArray(alertsProp);
    const categories = asArray(categoriesProp);
    const movements =
        movementsProp &&
        typeof movementsProp === 'object' &&
        Array.isArray(movementsProp.data)
            ? movementsProp
            : {
                  data: [],
                  current_page: 1,
                  last_page: 1,
                  total: 0,
              };

    const [search, setSearch] = useState(filters?.q ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');
    const [tab, setTab] = useState('products');
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [policyOpen, setPolicyOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

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

    const createForm = useForm({
        sku: '',
        barcode: '',
        name: '',
        price: '',
        tax_rate: 0,
        unit: 'pieza',
        initial_branch_quantity: '',
        category_id: null,
        redirect_to: 'inventory',
    });

    const submitCreateProduct = (e) => {
        e.preventDefault();
        createForm
            .transform((data) => ({
                ...data,
                category_id:
                    data.category_id === '' ||
                    data.category_id === null ||
                    data.category_id === undefined
                        ? null
                        : Number(data.category_id),
                initial_branch_quantity:
                    data.initial_branch_quantity === '' || data.initial_branch_quantity === null
                        ? null
                        : Number(data.initial_branch_quantity),
                tax_rate: data.tax_rate === '' || data.tax_rate === null ? 0 : Number(data.tax_rate),
            }))
            .post(route('products.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    createForm.reset();
                    createForm.setData({
                        sku: '',
                        barcode: '',
                        name: '',
                        price: '',
                        tax_rate: 0,
                        unit: 'pieza',
                        initial_branch_quantity: '',
                        category_id: null,
                        redirect_to: 'inventory',
                    });
                    setCreateOpen(false);
                },
            });
    };

    const productNameById = useMemo(() => {
        const m = {};
        for (const p of products) {
            m[p.id] = p.name;
        }
        return m;
    }, [products]);

    const submitAdjust = (e) => {
        e.preventDefault();
        if (!adjustForm.data.product_id) return;

        adjustForm.post(route('inventory.adjust', adjustForm.data.product_id), {
            preserveScroll: true,
            onSuccess: () => {
                adjustForm.reset('new_quantity', 'reason');
                setAdjustOpen(false);
            },
        });
    };

    const submitPolicy = (e) => {
        e.preventDefault();
        if (!policyForm.data.product_id) return;

        policyForm.patch(route('inventory.policy.update', policyForm.data.product_id), {
            preserveScroll: true,
            onSuccess: () => {
                setPolicyOpen(false);
            },
        });
    };

    const selectProductForForms = (product) => {
        adjustForm.setData((prev) => ({
            ...prev,
            product_id: String(product.id),
        }));
        policyForm.setData({
            product_id: String(product.id),
            min_threshold: product.policy?.min_threshold ?? 10,
            is_alert_enabled: product.policy?.is_alert_enabled ?? true,
            cooldown_minutes: product.policy?.cooldown_minutes ?? 60,
        });
    };

    const openAdjust = (product) => {
        selectProductForForms(product);
        setAdjustOpen(true);
    };

    const openPolicy = (product) => {
        selectProductForForms(product);
        setPolicyOpen(true);
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
        return `Página ${movements.current_page} de ${movements.last_page} (${movements.total} registros)`;
    }, [movements]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">Inventario</h2>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                        {canCreateProduct ? (
                            <Button
                                type="button"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="size-4" />
                                Crear producto
                            </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                            <Link href={route('products.page')}>Ir al catálogo</Link>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Inventario" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-muted-foreground">
                        Sucursal activa · #{activeBranchId}
                    </p>

                    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-xs">
                            <TabsList className="h-auto min-h-9 w-full flex-wrap justify-start sm:w-auto">
                                <TabsTrigger value="products">Productos</TabsTrigger>
                                <TabsTrigger value="alerts" className="gap-1.5">
                                    Alertas
                                    {alerts.length > 0 ? (
                                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[0.65rem]">
                                            {alerts.length}
                                        </Badge>
                                    ) : null}
                                </TabsTrigger>
                                <TabsTrigger value="movements">Movimientos</TabsTrigger>
                            </TabsList>
                            <Separator
                                orientation="vertical"
                                decorative
                                className="mx-1 hidden h-6 w-px shrink-0 bg-border sm:block"
                            />
                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                                <Link href={route('product-categories.page')}>Categorías</Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                                <Link href={route('inventory.transfers.page')}>Transferencias</Link>
                            </Button>
                        </div>

                    <TabsContent value="products" className="mt-0 outline-none">
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <form
                                className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                                onSubmit={applyFilters}
                            >
                                <div className="relative min-w-0 flex-1 sm:max-w-md">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="ps-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar por SKU o nombre"
                                        aria-label="Buscador"
                                    />
                                </div>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-full sm:w-48" aria-label="Estado de stock">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="ok">Stock normal</SelectItem>
                                        <SelectItem value="low">Bajo stock</SelectItem>
                                        <SelectItem value="critical">Crítico</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" variant="secondary">
                                    Aplicar
                                </Button>
                            </form>

                            <div className="rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="min-w-[200px]">Producto</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">Existencias</TableHead>
                                            {canManage ? (
                                                <TableHead className="w-12 text-right pr-4"> </TableHead>
                                            ) : null}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.length === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={canManage ? 5 : 4}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    No hay productos con los filtros actuales.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            products.map((product) => {
                                                const threshold = Number(
                                                    product.policy?.min_threshold ?? 10,
                                                );
                                                const stock = Number(product.quantity_on_hand);
                                                const isLow = stock <= threshold;
                                                const categoryLabel =
                                                    product.category?.name ?? 'Sin categoría';

                                                return (
                                                    <TableRow key={product.id}>
                                                        <TableCell>
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                                    <Package className="size-4" aria-hidden />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-foreground">
                                                                        {product.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {categoryLabel}
                                                                        {isLow ? (
                                                                            <span className="ms-2 text-amber-700 dark:text-amber-400">
                                                                                · Bajo mínimo
                                                                            </span>
                                                                        ) : null}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right tabular-nums font-medium">
                                                            {formatMxn(product.price ?? 0)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                                            {product.sku}
                                                        </TableCell>
                                                        <TableCell className="text-right tabular-nums">
                                                            {product.quantity_on_hand}{' '}
                                                            <span className="text-muted-foreground">
                                                                {product.unit}
                                                            </span>
                                                        </TableCell>
                                                        {canManage ? (
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon-sm"
                                                                            className="text-muted-foreground"
                                                                            aria-label={`Acciones para ${product.name}`}
                                                                        >
                                                                            <MoreHorizontal className="size-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        <DropdownMenuItem
                                                                            onSelect={() => openAdjust(product)}
                                                                        >
                                                                            Ajustar stock
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onSelect={() => openPolicy(product)}
                                                                        >
                                                                            Política de alertas
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        ) : null}
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="alerts" className="mt-0 outline-none">
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <h3 className="mb-4 text-lg font-semibold text-foreground">Alertas abiertas</h3>
                            {alerts.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    Sin alertas abiertas.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {alerts.map((alert) => (
                                        <li
                                            key={alert.id}
                                            className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {productNameById[alert.product_id] ??
                                                        `Producto #${alert.product_id}`}{' '}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        · {alert.severity}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Stock actual {alert.current_stock} · Mínimo {alert.threshold}
                                                </p>
                                            </div>
                                            {canManage ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0 border-destructive/30"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    Atender
                                                </Button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="movements" className="mt-0 outline-none">
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <h3 className="mb-1 text-lg font-semibold text-foreground">
                                Últimos movimientos (kardex)
                            </h3>
                            <p className="mb-4 text-xs text-muted-foreground">{movementSummary}</p>
                            <div className="rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>ID</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Delta</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!movements?.data?.length ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    Sin movimientos.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            movements.data.map((movement) => (
                                                <TableRow key={movement.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        #{movement.id}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {productNameById[movement.product_id] ??
                                                            `#${movement.product_id}`}
                                                    </TableCell>
                                                    <TableCell>{movement.type}</TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {movement.quantity_delta}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {movement.balance_after}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={(movements.current_page ?? 1) <= 1}
                                    onClick={() =>
                                        goToMovementPage((movements.current_page ?? 1) - 1)
                                    }
                                >
                                    Anterior
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        (movements.current_page ?? 1) >= (movements.last_page ?? 1)
                                    }
                                    onClick={() =>
                                        goToMovementPage((movements.current_page ?? 1) + 1)
                                    }
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                    </Tabs>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton>
                            <DialogHeader>
                                <DialogTitle>Nuevo producto</DialogTitle>
                                <DialogDescription>
                                    Se creará en tu catálogo; el SKU debe ser único. Opcionalmente define stock
                                    inicial en la sucursal activa.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                id="inventory-create-product-form"
                                className="grid gap-4"
                                onSubmit={submitCreateProduct}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="cp-name">Nombre</Label>
                                        <Input
                                            id="cp-name"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            required
                                        />
                                        <FormFieldError message={createForm.errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cp-sku">SKU</Label>
                                        <Input
                                            id="cp-sku"
                                            value={createForm.data.sku}
                                            onChange={(e) => createForm.setData('sku', e.target.value)}
                                            required
                                        />
                                        <FormFieldError message={createForm.errors.sku} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cp-price">Precio</Label>
                                        <Input
                                            id="cp-price"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={createForm.data.price}
                                            onChange={(e) => createForm.setData('price', e.target.value)}
                                            required
                                        />
                                        <FormFieldError message={createForm.errors.price} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cp-barcode">Código de barras (opcional)</Label>
                                        <Input
                                            id="cp-barcode"
                                            value={createForm.data.barcode}
                                            onChange={(e) => createForm.setData('barcode', e.target.value)}
                                        />
                                        <FormFieldError message={createForm.errors.barcode} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cp-unit">Unidad</Label>
                                        <Select
                                            value={createForm.data.unit}
                                            onValueChange={(v) => createForm.setData('unit', v)}
                                        >
                                            <SelectTrigger id="cp-unit">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="pieza">Pieza</SelectItem>
                                                <SelectItem value="kg">Kilogramo</SelectItem>
                                                <SelectItem value="g">Gramo</SelectItem>
                                                <SelectItem value="l">Litro</SelectItem>
                                                <SelectItem value="ml">Mililitro</SelectItem>
                                                <SelectItem value="m">Metro</SelectItem>
                                                <SelectItem value="caja">Caja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormFieldError message={createForm.errors.unit} />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="cp-cat">Categoría (opcional)</Label>
                                        <Select
                                            value={
                                                createForm.data.category_id == null
                                                    ? CATEGORY_NONE_VALUE
                                                    : String(createForm.data.category_id)
                                            }
                                            onValueChange={(v) =>
                                                createForm.setData(
                                                    'category_id',
                                                    v === CATEGORY_NONE_VALUE ? null : Number(v),
                                                )
                                            }
                                        >
                                            <SelectTrigger id="cp-cat">
                                                <SelectValue placeholder="Sin categoría" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value={CATEGORY_NONE_VALUE}>
                                                    Sin categoría
                                                </SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormFieldError message={createForm.errors.category_id} />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="cp-stock">Stock inicial en sucursal (opcional)</Label>
                                        <Input
                                            id="cp-stock"
                                            type="number"
                                            min={0}
                                            step="0.001"
                                            value={createForm.data.initial_branch_quantity}
                                            onChange={(e) =>
                                                createForm.setData('initial_branch_quantity', e.target.value)
                                            }
                                        />
                                        <FormFieldError message={createForm.errors.initial_branch_quantity} />
                                    </div>
                                </div>
                            </form>
                            <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    form="inventory-create-product-form"
                                    disabled={createForm.processing}
                                >
                                    Crear
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                        <DialogContent className="sm:max-w-md" showCloseButton>
                            <DialogHeader>
                                <DialogTitle>Ajustar inventario</DialogTitle>
                                <DialogDescription>
                                    Define el nuevo stock físico en sucursal y un motivo breve para dejar rastro en
                                    auditoría.
                                </DialogDescription>
                            </DialogHeader>
                            <form id="inventory-adjust-form" className="grid gap-4" onSubmit={submitAdjust}>
                                <div className="grid gap-2">
                                    <Label htmlFor="adj-qty">Nuevo stock</Label>
                                    <Input
                                        id="adj-qty"
                                        value={adjustForm.data.new_quantity}
                                        onChange={(e) =>
                                            adjustForm.setData('new_quantity', e.target.value)
                                        }
                                    />
                                    <FormFieldError message={adjustForm.errors.new_quantity} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="adj-reason">Motivo</Label>
                                    <Input
                                        id="adj-reason"
                                        value={adjustForm.data.reason}
                                        onChange={(e) => adjustForm.setData('reason', e.target.value)}
                                    />
                                    <FormFieldError message={adjustForm.errors.reason} />
                                </div>
                            </form>
                            <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    form="inventory-adjust-form"
                                    disabled={adjustForm.processing}
                                >
                                    Aplicar ajuste
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
                        <DialogContent className="sm:max-w-md" showCloseButton>
                            <DialogHeader>
                                <DialogTitle>Política de alertas</DialogTitle>
                                <DialogDescription>
                                    Umbral mínimo y tiempo de espera entre alertas repetidas para este producto en la
                                    sucursal activa.
                                </DialogDescription>
                            </DialogHeader>
                            <form id="inventory-policy-form" className="grid gap-4" onSubmit={submitPolicy}>
                                <div className="grid gap-2">
                                    <Label htmlFor="pol-min">Umbral mínimo</Label>
                                    <Input
                                        id="pol-min"
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={policyForm.data.min_threshold}
                                        onChange={(e) =>
                                            policyForm.setData(
                                                'min_threshold',
                                                e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                        }
                                    />
                                    <FormFieldError message={policyForm.errors.min_threshold} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pol-cool">Cooldown (minutos)</Label>
                                    <Input
                                        id="pol-cool"
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={policyForm.data.cooldown_minutes}
                                        onChange={(e) =>
                                            policyForm.setData(
                                                'cooldown_minutes',
                                                e.target.value === '' ? '' : Number(e.target.value),
                                            )
                                        }
                                    />
                                    <FormFieldError message={policyForm.errors.cooldown_minutes} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="pol-enabled"
                                        checked={policyForm.data.is_alert_enabled}
                                        onCheckedChange={(checked) =>
                                            policyForm.setData('is_alert_enabled', checked === true)
                                        }
                                    />
                                    <Label htmlFor="pol-enabled" className="font-normal">
                                        Alertas habilitadas
                                    </Label>
                                </div>
                            </form>
                            <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setPolicyOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    form="inventory-policy-form"
                                    disabled={policyForm.processing}
                                >
                                    Guardar política
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
