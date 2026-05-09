import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EvBarcodeScanner from '@/Components/EvBarcodeScanner';
import EvNumpadField from '@/Components/EvNumpadField';
import EvOperationalAlert from '@/Components/EvOperationalAlert';
import EvPrivacyConsent from '@/Components/EvPrivacyConsent';
import EvScaleReader from '@/Components/EvScaleReader';
import EvSwipeAction from '@/Components/EvSwipeAction';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { formatMxn } from '@/lib/money';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function salePayloadForBroadcast(s) {
    if (!s) return null;
    return {
        id: s.id,
        status: s.status,
        payment_status: s.payment_status,
        subtotal: s.subtotal,
        tax_total: s.tax_total,
        total: s.total,
        items: (s.items || []).map((i) => ({
            id: i.id,
            product_name: i.product_name,
            product_sku: i.product_sku,
            quantity: i.quantity,
            line_total: i.line_total,
        })),
    };
}

export default function SalesIndex({
    products,
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
        window.open(customerDisplayUrl, 'posCustomerDisplay', 'noopener,noreferrer');
    };

    const openTicketPrint = (autoprint = false) => {
        if (!ticketPrintUrl) return;
        const url = autoprint ? `${ticketPrintUrl}?autoprint=1` : ticketPrintUrl;
        window.open(url, 'posTicketPrint', 'noopener,noreferrer');
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Punto de venta
                </h2>
            }
        >
            <Head title="Ventas" />

            <div className="py-6 sm:py-8">
                {storeVertical && (
                    <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-xl border border-primary/20 bg-secondary p-4 text-secondary-foreground">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Operación de tienda (ventas · reporte · impresión)
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Cola:{' '}
                                        <code className="rounded bg-background/60 px-1">
                                            {storeVertical.queue_connection}
                                        </code>
                                        {storeVertical.needs_queue_worker
                                            ? ' · Ejecute «php artisan queue:work» en el punto de venta (o use scripts/start-store-stack.cmd).'
                                            : ' · Sin worker externo (sync).'}
                                        {storeVertical.print_after_pay
                                            ? ' Ticket tras cobro: activado.'
                                            : ' Ticket tras cobro: desactivado (PRINT_AFTER_PAY).'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {storeVertical.daily_report_url ? (
                                        <Link
                                            href={storeVertical.daily_report_url}
                                            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                        >
                                            Reporte del día
                                        </Link>
                                    ) : null}
                                    <span
                                        className="inline-flex items-center rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground"
                                        title="Configure PRINT_NOTIFY_AGENT y PRINT_AGENT_URL; ejecute el agente Node."
                                    >
                                        Agente:{' '}
                                        {storeVertical.notify_agent && storeVertical.agent_configured
                                            ? 'HTTP listo'
                                            : 'no configurado'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
                            <div className="p-4 sm:p-6">
                                <h3 className="mb-2 text-sm font-semibold text-foreground">
                                    Tienda activa
                                </h3>
                                <select
                                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                    value={activeBranchId}
                                    onChange={changeBranch}
                                >
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                            {branch.city ? ` - ${branch.city}` : ''}
                                            {branch.is_main ? ' (Matriz)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
                            <div className="p-4 sm:p-6">
                                {!sale ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            Inicia un ticket para escanear productos (lector láser o pistola suele
                                            actuar como teclado: enfoca el campo de código y escanea).
                                        </p>
                                        <PrimaryButton size="touch-lg" onClick={createSale}>
                                            Nuevo ticket
                                        </PrimaryButton>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                    Ticket #{sale.id}
                                                </p>
                                                <p className="text-base font-semibold text-foreground">
                                                    {sale.status === 'draft' ? 'En borrador' : sale.status}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cobro: {sale.payment_status}
                                                </p>
                                                {sale.customer ? (
                                                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                                        Cliente: {sale.customer.name}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {sale.status === 'draft' ? (
                                                    <PrimaryButton size="touch-lg" onClick={confirmSale}>
                                                        Confirmar venta
                                                    </PrimaryButton>
                                                ) : sale.payment_status === 'unpaid' ? (
                                                    <PrimaryButton size="touch-lg" onClick={payCash}>
                                                        Cobrar efectivo
                                                    </PrimaryButton>
                                                ) : null}
                                                {customerDisplayUrl ? (
                                                    <SecondaryButton size="touch" type="button" onClick={openCustomerDisplay}>
                                                        Pantalla cliente
                                                    </SecondaryButton>
                                                ) : null}
                                                {ticketPrintUrl ? (
                                                    <>
                                                        <SecondaryButton size="touch" type="button" onClick={() => openTicketPrint(false)}>
                                                            Vista ticket
                                                        </SecondaryButton>
                                                        <SecondaryButton size="touch" type="button" onClick={() => openTicketPrint(true)}>
                                                            Imprimir ticket
                                                        </SecondaryButton>
                                                    </>
                                                ) : null}
                                                {ticketDigitalUrl ? (
                                                    <Link
                                                        href={ticketDigitalUrl}
                                                        className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-muted active:scale-[0.98] focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                                    >
                                                        Ticket digital
                                                    </Link>
                                                ) : null}
                                                {printQueueUrl ? (
                                                    <SecondaryButton size="touch" type="button" onClick={enqueuePrint}>
                                                        Encolar impresión
                                                    </SecondaryButton>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
                                            <p className="text-muted-foreground">Subtotal: <span className="text-foreground tabular-nums">{money(sale.subtotal)}</span></p>
                                            <p className="text-muted-foreground">Impuestos: <span className="text-foreground tabular-nums">{money(sale.tax_total)}</span></p>
                                            <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
                                                Total: {money(sale.total)}
                                            </p>
                                        </div>

                                        <div
                                            className="touch-scroll-y scrollbar-hide max-h-[58vh] space-y-2 pr-1 sm:max-h-[64vh]"
                                            data-slot="cart-list"
                                        >
                                            {sale.items.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Escanea el código del producto (mismo valor que el SKU del
                                                    catálogo).
                                                </p>
                                            ) : (
                                                sale.items.map((item) => {
                                                    const itemRow = (
                                                        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-foreground">
                                                                    {item.product_name}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {item.product_sku} · {item.quantity} ×{' '}
                                                                    {money(item.unit_price)} · {money(item.line_total)}
                                                                </p>
                                                            </div>
                                                            {sale.status === 'draft' && (
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="touch-icon"
                                                                    aria-label={`Quitar ${item.product_name} del ticket`}
                                                                    title="Quitar partida (o desliza la fila a la izquierda)"
                                                                    onClick={() => removeItem(item.id)}
                                                                >
                                                                    <Trash2 aria-hidden="true" />
                                                                    <span className="sr-only">Quitar partida</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );

                                                    if (sale.status !== 'draft') {
                                                        return (
                                                            <div key={item.id}>{itemRow}</div>
                                                        );
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
                                                })
                                            )}
                                        </div>
                                        {errors.payment && (
                                            <p className="text-sm font-medium text-destructive">{errors.payment}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <EvPrivacyConsent sale={sale} />

                        {sale?.status === 'draft' && (
                            <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
                                <form className="space-y-4 p-4 sm:p-6" onSubmit={addItem} autoComplete="off">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            Escanear o codigo
                                        </h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            El lector envia Enter al final. Se agrega la linea automaticamente y el
                                            foco vuelve aqui. Las repeticiones del mismo codigo en menos de 600 ms
                                            se descartan para evitar duplicados.
                                        </p>
                                    </div>

                                    {scannerAlert ? (
                                        <EvOperationalAlert
                                            variant={scannerAlert.variant}
                                            title={scannerAlert.title}
                                            description={scannerAlert.description}
                                            onDismiss={() => setScannerAlert(null)}
                                        />
                                    ) : null}

                                    {errors.scan_code ? (
                                        <EvOperationalAlert
                                            variant="error"
                                            title="Codigo no reconocido"
                                            description={errors.scan_code}
                                        />
                                    ) : null}

                                    <EvBarcodeScanner
                                        ref={scannerRef}
                                        onScan={handleScan}
                                        onDuplicate={handleScanDuplicate}
                                        onInvalid={handleScanInvalid}
                                        disabled={itemForm.processing}
                                    />

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="quantity" value="Cantidad (manual)" />
                                            <div className="mt-1 flex items-stretch gap-2">
                                                <TextInput
                                                    id="quantity"
                                                    size="touch"
                                                    className="block w-full flex-1"
                                                    value={itemForm.data.quantity}
                                                    onChange={(e) => itemForm.setData('quantity', e.target.value)}
                                                    inputMode="decimal"
                                                />
                                                <EvNumpadField
                                                    value={itemForm.data.quantity}
                                                    onChange={(next) => itemForm.setData('quantity', next)}
                                                    mode="decimal"
                                                    label="Cantidad de la partida"
                                                    description="Captura cantidad entera o con hasta 3 decimales (kg)."
                                                    triggerLabel="Numpad para cantidad"
                                                />
                                            </div>
                                            <InputError className="mt-2" message={errors.quantity} />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="weight_grams" value="Peso (gramos enteros)" />
                                            <div className="mt-1 flex items-stretch gap-2">
                                                <TextInput
                                                    id="weight_grams"
                                                    size="touch"
                                                    className="block w-full flex-1"
                                                    value={itemForm.data.weight_grams}
                                                    onChange={(e) =>
                                                        itemForm.setData('weight_grams', e.target.value.replace(/\D/g, ''))
                                                    }
                                                    inputMode="numeric"
                                                    placeholder="ej. 1234"
                                                />
                                                <EvNumpadField
                                                    value={itemForm.data.weight_grams}
                                                    onChange={(next) => itemForm.setData('weight_grams', next.replace(/\D/g, ''))}
                                                    mode="integer"
                                                    label="Peso en gramos"
                                                    description="Captura el peso en gramos enteros (sin decimales). Ej. 1234 = 1.234 kg."
                                                    triggerLabel="Numpad para peso"
                                                />
                                            </div>
                                            <InputError className="mt-2" message={errors.weight_grams} />
                                        </div>
                                    </div>

                                    <PrimaryButton size="touch-lg" type="submit" className="w-full sm:w-auto">
                                        Agregar al ticket
                                    </PrimaryButton>

                                    <details className="rounded-lg border border-border p-3" open={isWeightProduct}>
                                        <summary className="cursor-pointer text-sm font-medium text-foreground">
                                            Busqueda manual (sin escaner)
                                        </summary>
                                        <div className="mt-3 space-y-2">
                                            <InputLabel htmlFor="product_id" value="Producto" />
                                            <select
                                                id="product_id"
                                                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                                value={itemForm.data.product_id}
                                                onChange={(e) =>
                                                    itemForm.setData('product_id', e.target.value)
                                                }
                                            >
                                                <option value="">Selecciona</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} ({product.sku}) - {money(product.price)} - {product.unit}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError className="mt-2" message={errors.product_id} />
                                            <p className="text-xs text-muted-foreground">
                                                Si seleccionas un producto por peso, usa la bascula de abajo para capturar el peso exacto.
                                            </p>
                                        </div>
                                    </details>
                                </form>
                            </div>
                        )}

                        {sale?.status === 'draft' && isWeightProduct ? (
                            <div className="space-y-3">
                                {scaleAlert ? (
                                    <EvOperationalAlert
                                        variant={scaleAlert.variant}
                                        title={scaleAlert.title}
                                        description={scaleAlert.description}
                                        onDismiss={() => setScaleAlert(null)}
                                    />
                                ) : null}
                                <EvScaleReader onCapture={handleScaleCapture} />
                            </div>
                        ) : null}
                        <div
                            className={`overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-all ${
                                shouldFocusOpenCash
                                    ? 'border-primary/40 ring-2 ring-primary/30'
                                    : 'border-border'
                            }`}
                        >
                            <div className="space-y-3 p-4 sm:p-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Caja registradora
                                </h3>
                                {shouldFocusOpenCash && (
                                    <p className="rounded-lg border border-primary/20 bg-secondary p-2 text-sm font-medium text-secondary-foreground">
                                        Acción rápida: captura el fondo inicial para abrir caja.
                                    </p>
                                )}
                                {cashSession ? (
                                    <>
                                        <p className="text-sm text-foreground">
                                            Turno #{cashSession.id}
                                        </p>
                                        {cashSession.cash_register && (
                                            <p className="text-sm text-muted-foreground">
                                                Caja: {cashSession.cash_register.name}
                                                {cashSession.cash_register.code
                                                    ? ` (${cashSession.cash_register.code})`
                                                    : ''}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Ventas efectivo: <span className="text-foreground tabular-nums">{money(cashSession.cash_sales_total)}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Esperado al cierre:{' '}
                                            <span className="text-foreground tabular-nums">{money(
                                                Number(cashSession.opening_amount) +
                                                    Number(cashSession.cash_sales_total),
                                            )}</span>
                                        </p>
                                        <form onSubmit={closeCash} className="space-y-2">
                                            <InputLabel htmlFor="closing_amount" value="Monto de cierre" />
                                            <div className="mt-1 flex items-stretch gap-2">
                                                <TextInput
                                                    id="closing_amount"
                                                    size="touch"
                                                    className="block w-full flex-1"
                                                    value={cashForm.data.closing_amount}
                                                    onChange={(e) =>
                                                        cashForm.setData('closing_amount', e.target.value)
                                                    }
                                                />
                                                <EvNumpadField
                                                    value={cashForm.data.closing_amount}
                                                    onChange={(next) => cashForm.setData('closing_amount', next)}
                                                    mode="currency"
                                                    label="Monto contado al cierre"
                                                    description="Captura el monto total en MXN con dos decimales."
                                                    triggerLabel="Numpad para monto de cierre"
                                                />
                                            </div>
                                            <InputLabel htmlFor="closing_note" value="Motivo descuadre (si aplica)" />
                                            <TextInput
                                                id="closing_note"
                                                size="touch"
                                                className="mt-1 block w-full"
                                                value={cashForm.data.closing_note}
                                                onChange={(e) =>
                                                    cashForm.setData('closing_note', e.target.value)
                                                }
                                            />
                                            <div className="rounded-lg border border-border p-3">
                                                <p className="text-sm font-medium text-foreground">
                                                    Arqueo por denominaciones
                                                </p>
                                                <div className="mt-2 space-y-2">
                                                    {cashForm.data.denominations.map((line, index) => (
                                                        <div
                                                            key={`${line.kind}-${line.value}`}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <span className="w-28 text-muted-foreground tabular-nums">
                                                                {(line.value / 100).toLocaleString('es-MX', {
                                                                    style: 'currency',
                                                                    currency: 'MXN',
                                                                })}
                                                            </span>
                                                            <TextInput
                                                                className="w-24"
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
                                                    <span className="text-foreground tabular-nums">{(countedTotal / 100).toLocaleString('es-MX', {
                                                        style: 'currency',
                                                        currency: 'MXN',
                                                    })}</span>
                                                </p>
                                            </div>
                                            <PrimaryButton size="touch-lg" disabled={cashForm.processing}>
                                                Cerrar caja
                                            </PrimaryButton>
                                        </form>
                                    </>
                                ) : (
                                    <form onSubmit={openCash} className="space-y-2">
                                        {cashRegisters.length > 1 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="cash_register_id"
                                                    value="Caja registradora"
                                                />
                                                <select
                                                    id="cash_register_id"
                                                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                                    value={cashForm.data.cash_register_id}
                                                    onChange={(e) =>
                                                        cashForm.setData('cash_register_id', e.target.value)
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
                                        <InputLabel htmlFor="opening_amount" value="Fondo inicial" />
                                        <div className="mt-1 flex items-stretch gap-2">
                                            <TextInput
                                                id="opening_amount"
                                                size="touch"
                                                className="block w-full flex-1"
                                                ref={openCashInputRef}
                                                value={cashForm.data.opening_amount}
                                                onChange={(e) =>
                                                    cashForm.setData('opening_amount', e.target.value)
                                                }
                                            />
                                            <EvNumpadField
                                                value={cashForm.data.opening_amount}
                                                onChange={(next) => cashForm.setData('opening_amount', next)}
                                                mode="currency"
                                                label="Fondo inicial de caja"
                                                description="Captura el fondo en MXN con dos decimales."
                                                triggerLabel="Numpad para fondo inicial"
                                            />
                                        </div>
                                        <PrimaryButton size="touch-lg" disabled={cashForm.processing}>
                                            Abrir caja
                                        </PrimaryButton>
                                    </form>
                                )}
                                {(errors.cash || errors.cash_register_id) && (
                                    <p className="text-sm font-medium text-destructive">{errors.cash || errors.cash_register_id}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
