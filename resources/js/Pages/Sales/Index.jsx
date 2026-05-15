import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EvBarcodeScanner from '@/Components/EvBarcodeScanner';
import EvNumpadField from '@/Components/EvNumpadField';
import EvOperationalAlert from '@/Components/EvOperationalAlert';
import EvPrivacyConsent from '@/Components/EvPrivacyConsent';
import EvScaleReader from '@/Components/EvScaleReader';
import EvSwipeAction from '@/Components/EvSwipeAction';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PosStepsProgress from '@/Pages/Sales/PosStepsProgress';
import PosTopbar from '@/Pages/Sales/PosTopbar';
import { salePayloadForBroadcast } from '@/Pages/Sales/saleBroadcast';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/Components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';
import { formatMxn } from '@/lib/money';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    MoreHorizontal,
    Printer,
    Settings,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function SalesIndex({
    products,
    categories = [],
    sale,
    cashSession,
    cashRegisters = [],
    branches,
    activeBranchId,
    customerDisplayUrl,
    ticketPrintUrl,
    ticketDigitalUrl,
    printQueueUrl,
    ui,
    store_vertical: storeVertical,
}) {
    const { errors } = usePage().props;
    const openCashInputRef = useRef(null);
    const scannerRef = useRef(null);
    const shouldFocusOpenCash = Boolean(ui?.focus_open_cash) && !cashSession;
    const [scannerAlert, setScannerAlert] = useState(null);
    const [scaleAlert, setScaleAlert] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null); // null = todas las categorías

    const itemForm = useForm({
        scan_code: '',
        product_id: '',
        quantity: 1,
        weight_grams: '',
    });

    const selectedProduct = useMemo(() => {
        if (!itemForm.data.product_id) return null;
        return products.find((p) => String(p.id) === String(itemForm.data.product_id)) ?? null;
    }, [itemForm.data.product_id, products]);

    const filteredProducts = useMemo(() => {
        if (categoryFilter === null) return products;
        if (categoryFilter === 'uncategorized') {
            return products.filter((p) => p.category_id === null);
        }
        return products.filter((p) => p.category_id === categoryFilter);
    }, [products, categoryFilter]);

    const isWeightProduct = useMemo(() => {
        const unit = (selectedProduct?.unit ?? '').toLowerCase();
        return unit === 'kg' || unit === 'g' || unit.includes('peso');
    }, [selectedProduct]);

    const cashForm = useForm({
        opening_amount: 0,
        cash_register_id: '',
        closing_amount: '',
        closing_note: '',
        denominations: [
            { kind: 'bill', value: 100000, quantity: 0 },
            { kind: 'bill', value: 50000, quantity: 0 },
            { kind: 'bill', value: 20000, quantity: 0 },
            { kind: 'coin', value: 1000, quantity: 0 },
            { kind: 'coin', value: 500, quantity: 0 },
            { kind: 'coin', value: 100, quantity: 0 },
        ],
    });

    const createSale = () => {
        router.post(route('sales.store'));
    };

    const submitItem = (payload, { afterSuccess } = {}) => {
        if (!sale) return;
        router.post(route('sales.items.store', sale.id), payload, {
            preserveScroll: true,
            onSuccess: () => {
                itemForm.reset('scan_code', 'product_id', 'weight_grams');
                itemForm.setData('quantity', 1);
                afterSuccess?.();
            },
        });
    };

    const addItem = (e) => {
        e.preventDefault();
        if (!sale) return;

        const scan = itemForm.data.scan_code.trim();
        const qty = Number(itemForm.data.quantity);
        const weightGrams = Number(itemForm.data.weight_grams || 0);
        if ((!qty || qty <= 0) && weightGrams <= 0) return;

        const payload = { quantity: qty || 1 };
        if (weightGrams > 0) payload.weight_grams = weightGrams;
        if (scan) {
            payload.scan_code = scan;
        } else if (itemForm.data.product_id) {
            payload.product_id = itemForm.data.product_id;
        } else {
            return;
        }

        submitItem(payload, {
            afterSuccess: () => setTimeout(() => scannerRef.current?.focus(), 0),
        });
    };

    const handleScan = (code) => {
        setScannerAlert(null);
        if (!sale) return;
        submitItem(
            { scan_code: code, quantity: 1 },
            { afterSuccess: () => setTimeout(() => scannerRef.current?.focus(), 0) },
        );
    };

    const handleScanInvalid = ({ reason, code }) => {
        setScannerAlert({
            variant: 'warning',
            title: 'Lectura no aceptada',
            description:
                reason === 'too_short'
                    ? `Codigo "${code}" demasiado corto. Verifica que la pistola este en modo texto + Enter.`
                    : 'Formato de codigo invalido. Repite el escaneo.',
        });
    };

    const handleScanDuplicate = (code) => {
        setScannerAlert({
            variant: 'info',
            title: 'Doble disparo descartado',
            description: `El codigo "${code}" se recibio dos veces en menos de 600 ms y se ignoro la repeticion para evitar duplicados.`,
        });
    };

    const handleScaleCapture = ({ weightGrams, quantityKg }) => {
        if (!selectedProduct) {
            setScaleAlert({
                variant: 'warning',
                title: 'Selecciona el producto por peso',
                description: 'Elige primero el producto en "Busqueda manual" antes de capturar el peso.',
            });
            return;
        }
        setScaleAlert(null);
        itemForm.setData('weight_grams', weightGrams);
        itemForm.setData('quantity', quantityKg);
    };

    const removeItem = (itemId) => {
        if (!sale || sale.status !== 'draft') return;

        router.delete(route('sales.items.destroy', [sale.id, itemId]), {
            preserveScroll: true,
        });
    };

    const confirmSale = () => {
        if (!sale || sale.status !== 'draft') return;
        const idempotencyKey =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-confirm-${sale.id}`;

        router.post(
            route('sales.confirm', sale.id),
            { idempotency_key: idempotencyKey },
            { preserveScroll: true },
        );
    };

    const openCash = (e) => {
        e.preventDefault();
        cashForm.post(route('cash.open'), { preserveScroll: true });
    };

    const closeCash = (e) => {
        e.preventDefault();
        if (!cashSession) return;
        const idempotencyKey =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-cash-close-${cashSession.id}`;
        router.post(
            route('cash.close', cashSession.id),
            {
                closing_amount: cashForm.data.closing_amount,
                closing_note: cashForm.data.closing_note,
                denominations: cashForm.data.denominations,
                idempotency_key: idempotencyKey,
            },
            {
                preserveScroll: true,
                onSuccess: () => cashForm.reset('closing_amount', 'closing_note'),
            },
        );
    };

    const updateDenominationQuantity = (index, quantity) => {
        const normalized = Math.max(0, Number.parseInt(quantity || '0', 10) || 0);
        cashForm.setData(
            'denominations',
            cashForm.data.denominations.map((line, i) =>
                i === index ? { ...line, quantity: normalized } : line,
            ),
        );
    };

    const countedTotal = cashForm.data.denominations.reduce(
        (sum, line) => sum + Number(line.value) * Number(line.quantity || 0),
        0,
    );

    const payCash = () => {
        if (!sale || sale.payment_status === 'paid') return;
        const idempotencyKey =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${sale.id}`;
        router.post(
            route('sales.pay-cash', sale.id),
            { amount: sale.total, idempotency_key: idempotencyKey },
            { preserveScroll: true },
        );
    };

    const changeBranch = (e) => {
        const branchId = e.target.value;
        router.patch(route('active-branch.update', branchId), {}, { preserveScroll: true });
    };

    const openCustomerDisplay = () => {
        if (!customerDisplayUrl) return;
        const win = window.open(customerDisplayUrl, 'posCustomerDisplay', 'noopener,noreferrer');
        if (win != null) return;
        const fallback = window.open(customerDisplayUrl, '_blank', 'noopener,noreferrer');
        if (fallback != null) return;
        alert(
            'El navegador bloqueo la ventana emergente. Permití ventanas para este sitio o abrí la pantalla cliente en otra pestaña desde el mismo enlace.',
        );
    };

    const openTicketPrint = (autoprint = false) => {
        if (!ticketPrintUrl) return;
        const url = autoprint ? `${ticketPrintUrl}?autoprint=1` : ticketPrintUrl;
        const win = window.open(url, 'posTicketPrint', 'noopener,noreferrer');
        if (win != null) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const enqueuePrint = () => {
        if (!printQueueUrl) return;
        router.post(printQueueUrl, {}, { preserveScroll: true });
    };

    useEffect(() => {
        if (!shouldFocusOpenCash || !openCashInputRef.current) return;
        openCashInputRef.current.focus();
        const url = new URL(window.location.href);
        if (url.searchParams.has('open_cash')) {
            url.searchParams.delete('open_cash');
            window.history.replaceState({}, '', url.toString());
        }
    }, [shouldFocusOpenCash]);

    useEffect(() => {
        if (cashRegisters.length === 1) {
            cashForm.setData('cash_register_id', String(cashRegisters[0].id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cargar lista de cajas
    }, [cashRegisters]);

    useEffect(() => {
        if (sale?.status !== 'draft') return undefined;
        const t = setTimeout(() => scannerRef.current?.focus(), 150);
        return () => clearTimeout(t);
    }, [sale?.id, sale?.status]);

    useEffect(() => {
        if (!sale?.id || typeof BroadcastChannel === 'undefined') return undefined;
        const channel = new BroadcastChannel(`pos-sale-${sale.id}`);
        channel.postMessage({
            type: 'sale-update',
            sale: salePayloadForBroadcast(sale),
        });
        return () => channel.close();
    }, [sale]);

    const money = (v) => formatMxn(v ?? 0);

    /** Menú inferior del POS: sin modal (evita capas/punteros de Radix) y abre hacia arriba. */
    const posMoreActionsContentProps = {
        align: 'end',
        side: 'top',
        sideOffset: 8,
        className: 'z-[200] min-w-[10rem]',
    };

    const activeStep = !sale
        ? 1
        : sale.status === 'draft'
          ? 2
          : sale.payment_status === 'paid'
            ? 4
            : sale.status === 'confirmed'
              ? 3
              : 1;

    return (
        <AuthenticatedLayout>
            <Head title="Punto de venta" />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PosTopbar
                    branches={branches}
                    activeBranchId={activeBranchId}
                    onChangeBranch={changeBranch}
                    cashSession={cashSession}
                />

                <div className="grid min-h-0 flex-1 grid-cols-1 content-start overflow-y-auto touch-scroll-y lg:grid-cols-[1fr_min(100%,360px)] lg:overflow-hidden lg:content-stretch">
                    <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:min-h-0 lg:overflow-hidden">
                        <PosStepsProgress activeStep={activeStep} />

                        <div className="flex max-h-[min(50dvh,28rem)] min-h-[10rem] flex-1 flex-col overflow-hidden lg:max-h-none lg:min-h-0">
                        <div className="flex-1 overflow-y-auto touch-scroll-y" data-slot="cart-list">
                            {!sale ? (
                                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                                    <ShoppingCart
                                        className="size-12 text-muted-foreground/30"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Inicia un ticket nuevo para escanear productos.
                                    </p>
                                </div>
                            ) : sale.items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Escanea el primer producto.
                                    </p>
                                    {sale.customer ? (
                                        <Badge variant="secondary" className="mt-1">
                                            Cliente: {sale.customer.name}
                                        </Badge>
                                    ) : null}
                                </div>
                            ) : (
                                <div>
                                    {sale.customer ? (
                                        <Badge variant="secondary" className="mx-6 mb-2 mt-4">
                                            Cliente: {sale.customer.name}
                                        </Badge>
                                    ) : null}
                                    <div className="divide-y divide-border">
                                    {sale.items.map((item) => {
                                        const itemRow = (
                                            <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-6">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {item.product_sku} · {item.quantity} × {money(item.unit_price)}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                                    {money(item.line_total)}
                                                </span>
                                                {sale.status === 'draft' && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                        aria-label={`Quitar ${item.product_name} del ticket`}
                                                        title="Quitar partida (o desliza la fila a la izquierda)"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                        <span className="sr-only">Quitar partida</span>
                                                    </Button>
                                                )}
                                            </div>
                                        );

                                        if (sale.status !== 'draft') {
                                            return <div key={item.id}>{itemRow}</div>;
                                        }

                                        return (
                                            <EvSwipeAction
                                                key={item.id}
                                                onSwipeLeft={() => removeItem(item.id)}
                                                leftLabel="Quitar"
                                                LeftIcon={Trash2}
                                                leftTone="destructive"
                                                threshold={96}
                                            >
                                                {itemRow}
                                            </EvSwipeAction>
                                        );
                                    })}
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="shrink-0 border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
                            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{money(sale?.subtotal ?? 0)}</span>
                            </div>
                            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                                <span>IVA</span>
                                <span className="tabular-nums">{money(sale?.tax_total ?? 0)}</span>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Total</span>
                                <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
                                    {money(sale?.total ?? 0)}
                                </span>
                            </div>
                        </div>

                        {errors.payment && (
                            <div className="shrink-0 border-t border-border bg-destructive/10 px-4 py-2 sm:px-6">
                                <p className="text-sm font-medium text-destructive">{errors.payment}</p>
                            </div>
                        )}

                        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-background px-4 py-3 sm:px-6">
                            {!sale && (
                                <Button className="h-12 flex-1 text-base font-medium" onClick={createSale}>
                                    Nuevo ticket
                                </Button>
                            )}

                            {sale && sale.status === 'draft' && (
                                <>
                                    <Button className="h-12 flex-1 text-base font-medium" onClick={confirmSale}>
                                        Confirmar venta
                                    </Button>
                                    {customerDisplayUrl ? (
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-12 w-12 shrink-0"
                                                    aria-label="Mas acciones"
                                                >
                                                    <MoreHorizontal className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent {...posMoreActionsContentProps}>
                                                <DropdownMenuItem onSelect={openCustomerDisplay}>
                                                    Pantalla cliente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : null}
                                </>
                            )}

                            {sale && sale.status === 'confirmed' && sale.payment_status !== 'paid' && (
                                <>
                                    <Button className="h-12 flex-1 text-base font-medium" onClick={payCash}>
                                        Cobrar efectivo
                                    </Button>
                                    {customerDisplayUrl ? (
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-12 w-12 shrink-0"
                                                    aria-label="Mas acciones"
                                                >
                                                    <MoreHorizontal className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent {...posMoreActionsContentProps}>
                                                <DropdownMenuItem onSelect={openCustomerDisplay}>
                                                    Pantalla cliente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : null}
                                </>
                            )}

                            {sale && sale.payment_status === 'paid' && (
                                <>
                                    <Button
                                        className="h-12 flex-1 text-base font-medium"
                                        variant="outline"
                                        onClick={createSale}
                                    >
                                        Nuevo ticket
                                    </Button>
                                    {ticketPrintUrl ? (
                                        <Button
                                            className="h-12 px-6 text-base font-medium"
                                            onClick={() => openTicketPrint(true)}
                                        >
                                            <Printer className="size-4" aria-hidden="true" />
                                            Imprimir ticket
                                        </Button>
                                    ) : null}
                                    {(ticketDigitalUrl || printQueueUrl || customerDisplayUrl) && (
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-12 w-12 shrink-0"
                                                    aria-label="Mas acciones"
                                                >
                                                    <MoreHorizontal className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent {...posMoreActionsContentProps}>
                                                {ticketDigitalUrl ? (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={ticketDigitalUrl}>Ticket digital</Link>
                                                    </DropdownMenuItem>
                                                ) : null}
                                                {printQueueUrl ? (
                                                    <DropdownMenuItem onSelect={enqueuePrint}>
                                                        Encolar impresion
                                                    </DropdownMenuItem>
                                                ) : null}
                                                {customerDisplayUrl ? (
                                                    <DropdownMenuItem onSelect={openCustomerDisplay}>
                                                        Pantalla cliente
                                                    </DropdownMenuItem>
                                                ) : null}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="order-1 flex flex-col gap-0 overflow-y-auto border-b border-border bg-muted/30 touch-scroll-y lg:order-2 lg:min-h-0 lg:border-b-0 lg:border-l">
                        <div className="border-b border-border p-4">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Escanear
                            </p>
                            <EvBarcodeScanner
                                ref={scannerRef}
                                onScan={handleScan}
                                onDuplicate={handleScanDuplicate}
                                onInvalid={handleScanInvalid}
                                disabled={itemForm.processing}
                            />
                            {scannerAlert ? (
                                <div className="mt-2">
                                    <EvOperationalAlert
                                        variant={scannerAlert.variant}
                                        title={scannerAlert.title}
                                        description={scannerAlert.description}
                                        onDismiss={() => setScannerAlert(null)}
                                    />
                                </div>
                            ) : null}
                            {errors.scan_code ? (
                                <div className="mt-2">
                                    <EvOperationalAlert
                                        variant="error"
                                        title="Codigo no reconocido"
                                        description={errors.scan_code}
                                    />
                                </div>
                            ) : null}
                        </div>

                        {sale?.status === 'draft' && (
                            <div className="border-b border-border p-4 pb-5">
                                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Busqueda manual
                                </p>
                                {categories.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setCategoryFilter(null)}
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                                categoryFilter === null
                                                    ? 'border-foreground bg-foreground text-background'
                                                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            Todas
                                        </button>
                                        {categories.map((cat) => {
                                            const isActive = categoryFilter === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategoryFilter(cat.id)}
                                                    className={cn(
                                                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                                        isActive
                                                            ? 'border-transparent text-white'
                                                            : 'border-border bg-background text-muted-foreground hover:text-foreground',
                                                    )}
                                                    style={
                                                        isActive && cat.color
                                                            ? { backgroundColor: cat.color }
                                                            : undefined
                                                    }
                                                >
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setCategoryFilter('uncategorized')}
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                                categoryFilter === 'uncategorized'
                                                    ? 'border-foreground bg-foreground text-background'
                                                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            Sin categoría
                                        </button>
                                    </div>
                                )}
                                <Command className="overflow-hidden rounded-lg border border-border bg-background">
                                    <CommandInput
                                        placeholder="Nombre o SKU..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList>
                                        {searchQuery.length > 0 && (
                                            <CommandEmpty>
                                                Sin resultados para &quot;{searchQuery}&quot;
                                            </CommandEmpty>
                                        )}
                                        <CommandGroup>
                                            {filteredProducts.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={`${product.name} ${product.sku}`}
                                                    onSelect={() =>
                                                        itemForm.setData('product_id', String(product.id))
                                                    }
                                                >
                                                    <div className="flex flex-1 items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {product.name}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {product.sku}
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 text-sm tabular-nums">
                                                            {money(product.price)}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                {selectedProduct ? (
                                    <form
                                        onSubmit={addItem}
                                        className="mt-3 space-y-2"
                                        autoComplete="off"
                                    >
                                        <Badge
                                            variant="secondary"
                                            className="w-full justify-start gap-2 py-1.5"
                                        >
                                            {selectedProduct.name}
                                        </Badge>
                                        <div className="flex items-stretch gap-2">
                                            <TextInput
                                                id="quantity"
                                                value={itemForm.data.quantity}
                                                onChange={(e) =>
                                                    itemForm.setData('quantity', e.target.value)
                                                }
                                                inputMode="decimal"
                                                className="flex-1"
                                            />
                                            <EvNumpadField
                                                value={itemForm.data.quantity}
                                                onChange={(next) => itemForm.setData('quantity', next)}
                                                mode="decimal"
                                                label="Cantidad"
                                                description="Captura cantidad entera o con hasta 3 decimales (kg)."
                                                triggerLabel="Numpad"
                                            />
                                            <Button type="submit" disabled={itemForm.processing}>
                                                Agregar
                                            </Button>
                                        </div>
                                        <InputError message={errors.quantity} />
                                        {isWeightProduct ? (
                                            <div className="flex items-stretch gap-2">
                                                <TextInput
                                                    id="weight_grams"
                                                    value={itemForm.data.weight_grams}
                                                    onChange={(e) =>
                                                        itemForm.setData(
                                                            'weight_grams',
                                                            e.target.value.replace(/\D/g, ''),
                                                        )
                                                    }
                                                    inputMode="numeric"
                                                    placeholder="Peso (gramos)"
                                                    className="flex-1"
                                                />
                                                <EvNumpadField
                                                    value={itemForm.data.weight_grams}
                                                    onChange={(next) =>
                                                        itemForm.setData(
                                                            'weight_grams',
                                                            next.replace(/\D/g, ''),
                                                        )
                                                    }
                                                    mode="integer"
                                                    label="Peso en gramos"
                                                    description="Captura el peso en gramos enteros (sin decimales). Ej. 1234 = 1.234 kg."
                                                    triggerLabel="Numpad peso"
                                                />
                                            </div>
                                        ) : null}
                                        <InputError message={errors.weight_grams} />
                                        <InputError message={errors.product_id} />
                                    </form>
                                ) : null}
                            </div>
                        )}

                        {sale?.status === 'draft' && isWeightProduct ? (
                            <div className="border-b border-border p-4">
                                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Bascula
                                </p>
                                {scaleAlert ? (
                                    <div className="mb-2">
                                        <EvOperationalAlert
                                            variant={scaleAlert.variant}
                                            title={scaleAlert.title}
                                            description={scaleAlert.description}
                                            onDismiss={() => setScaleAlert(null)}
                                        />
                                    </div>
                                ) : null}
                                <EvScaleReader onCapture={handleScaleCapture} />
                            </div>
                        ) : null}

                        <div className="border-b border-border p-4">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Privacidad del cliente
                            </p>
                            <EvPrivacyConsent sale={sale} />
                        </div>

                        <div
                            className={cn(
                                'border-b border-border p-4',
                                shouldFocusOpenCash && 'rounded-lg ring-2 ring-ring ring-offset-2',
                            )}
                        >
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Caja registradora
                            </p>

                            {cashSession ? (
                                <Collapsible>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                Turno #{cashSession.id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Ventas: <span className="tabular-nums">{money(cashSession.cash_sales_total)}</span>
                                            </p>
                                            {cashSession.cash_register ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {cashSession.cash_register.name}
                                                    {cashSession.cash_register.code
                                                        ? ` (${cashSession.cash_register.code})`
                                                        : ''}
                                                </p>
                                            ) : null}
                                            <p className="text-xs text-muted-foreground">
                                                Esperado:{' '}
                                                <span className="tabular-nums">
                                                    {money(
                                                        Number(cashSession.opening_amount) +
                                                            Number(cashSession.cash_sales_total),
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                Cerrar turno
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent className="mt-3 space-y-3">
                                        <form onSubmit={closeCash} className="space-y-3">
                                            <div>
                                                <InputLabel
                                                    htmlFor="closing_amount"
                                                    value="Monto de cierre"
                                                />
                                                <div className="mt-1 flex items-stretch gap-2">
                                                    <TextInput
                                                        id="closing_amount"
                                                        className="block w-full flex-1"
                                                        value={cashForm.data.closing_amount}
                                                        onChange={(e) =>
                                                            cashForm.setData(
                                                                'closing_amount',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <EvNumpadField
                                                        value={cashForm.data.closing_amount}
                                                        onChange={(next) =>
                                                            cashForm.setData('closing_amount', next)
                                                        }
                                                        mode="currency"
                                                        label="Monto contado al cierre"
                                                        description="Captura el monto total en MXN con dos decimales."
                                                        triggerLabel="Numpad cierre"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="closing_note"
                                                    value="Motivo descuadre (si aplica)"
                                                />
                                                <TextInput
                                                    id="closing_note"
                                                    className="mt-1 block w-full"
                                                    value={cashForm.data.closing_note}
                                                    onChange={(e) =>
                                                        cashForm.setData('closing_note', e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="rounded-lg border border-border bg-background p-3">
                                                <p className="text-sm font-medium text-foreground">
                                                    Arqueo por denominaciones
                                                </p>
                                                <div className="mt-2 space-y-2">
                                                    {cashForm.data.denominations.map((line, index) => (
                                                        <div
                                                            key={`${line.kind}-${line.value}`}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <span className="w-24 text-muted-foreground tabular-nums">
                                                                {(line.value / 100).toLocaleString(
                                                                    'es-MX',
                                                                    {
                                                                        style: 'currency',
                                                                        currency: 'MXN',
                                                                    },
                                                                )}
                                                            </span>
                                                            <TextInput
                                                                className="w-20"
                                                                value={line.quantity}
                                                                onChange={(e) =>
                                                                    updateDenominationQuantity(
                                                                        index,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Total contado:{' '}
                                                    <span className="tabular-nums text-foreground">
                                                        {(countedTotal / 100).toLocaleString('es-MX', {
                                                            style: 'currency',
                                                            currency: 'MXN',
                                                        })}
                                                    </span>
                                                </p>
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={cashForm.processing}
                                            >
                                                Cerrar caja
                                            </Button>
                                        </form>
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <form onSubmit={openCash} className="space-y-3">
                                    {cashRegisters.length > 1 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="cash_register_id"
                                                value="Caja registradora"
                                            />
                                            <select
                                                id="cash_register_id"
                                                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                                value={cashForm.data.cash_register_id}
                                                onChange={(e) =>
                                                    cashForm.setData(
                                                        'cash_register_id',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            >
                                                <option value="">Selecciona</option>
                                                {cashRegisters.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name}
                                                        {r.code ? ` (${r.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                className="mt-2"
                                                message={cashForm.errors.cash_register_id}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <InputLabel htmlFor="opening_amount" value="Fondo inicial" />
                                        <div className="mt-1 flex items-stretch gap-2">
                                            <TextInput
                                                id="opening_amount"
                                                className="block w-full flex-1"
                                                ref={openCashInputRef}
                                                value={cashForm.data.opening_amount}
                                                onChange={(e) =>
                                                    cashForm.setData('opening_amount', e.target.value)
                                                }
                                            />
                                            <EvNumpadField
                                                value={cashForm.data.opening_amount}
                                                onChange={(next) =>
                                                    cashForm.setData('opening_amount', next)
                                                }
                                                mode="currency"
                                                label="Fondo inicial de caja"
                                                description="Captura el fondo en MXN con dos decimales."
                                                triggerLabel="Numpad fondo"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={cashForm.processing}
                                    >
                                        Abrir caja
                                    </Button>
                                </form>
                            )}

                            {(errors.cash || errors.cash_register_id) && (
                                <p className="mt-2 text-sm font-medium text-destructive">
                                    {errors.cash || errors.cash_register_id}
                                </p>
                            )}
                        </div>

                        {storeVertical ? (
                            <div className="mt-auto border-b border-border p-4">
                                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Operacion de tienda
                                </p>
                                <Collapsible>
                                    <CollapsibleTrigger className="flex w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                                        <Settings className="size-3 shrink-0" aria-hidden="true" />
                                        <span>Expandir detalles</span>
                                        <ChevronDown className="ml-auto size-3 shrink-0" aria-hidden="true" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        <p>
                                            Cola:{' '}
                                            <code className="rounded bg-background/60 px-1">
                                                {storeVertical.queue_connection}
                                            </code>
                                        </p>
                                        {storeVertical.needs_queue_worker ? (
                                            <p>Ejecute «php artisan queue:work»</p>
                                        ) : (
                                            <p>Sin worker externo (sync).</p>
                                        )}
                                        <p>
                                            {storeVertical.print_after_pay
                                                ? 'Ticket tras cobro: activado.'
                                                : 'Ticket tras cobro: desactivado.'}
                                        </p>
                                        <p>
                                            Agente:{' '}
                                            {storeVertical.notify_agent && storeVertical.agent_configured
                                                ? 'HTTP listo'
                                                : 'no configurado'}
                                        </p>
                                        {storeVertical.daily_report_url ? (
                                            <Link
                                                href={storeVertical.daily_report_url}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                Reporte del dia
                                            </Link>
                                        ) : null}
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
