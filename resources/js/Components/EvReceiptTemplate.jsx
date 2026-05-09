import { formatMxn } from '@/lib/money';

const METHOD_LABELS = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
};

function formatQuantity(value) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return '0';
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function formatIssuedAt(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('es-MX', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

function buildAddress(branch) {
    if (!branch) return '';
    return [
        branch.address,
        branch.neighborhood,
        branch.city,
        branch.state,
        branch.postal_code ? `C.P. ${branch.postal_code}` : null,
    ]
        .filter(Boolean)
        .join(' · ');
}

/**
 * Plantilla de comprobante con identidad Verde Bosque para versiones digitales (email/preview).
 * Refleja Robustez Perenne: jerarquia clara, totales prominentes, datos LFPC visibles.
 */
export default function EvReceiptTemplate({ receipt }) {
    if (!receipt) return null;

    const tradeName = receipt.tenant?.trade_name ?? 'Comercio Everden';
    const legalName =
        receipt.tenant?.legal_name && receipt.tenant.legal_name !== tradeName
            ? receipt.tenant.legal_name
            : null;
    const address = buildAddress(receipt.branch);
    const totalPaid = (receipt.payments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
    );
    const cashPaid = (receipt.payments ?? [])
        .filter((p) => p.method === 'cash')
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const change = Math.max(0, cashPaid - Number(receipt.total ?? 0));

    return (
        <article className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
            <header className="bg-gradient-to-br from-primary via-primary/95 to-accent p-6 text-primary-foreground">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
                            Robustez Perenne · Comprobante Everden
                        </p>
                        <h1 className="mt-2 text-2xl font-bold">{tradeName}</h1>
                        {legalName ? (
                            <p className="mt-1 text-sm text-primary-foreground/80">
                                Razon social: {legalName}
                            </p>
                        ) : null}
                    </div>
                    <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                        Folio #{receipt.folio}
                    </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-primary-foreground/85 sm:grid-cols-2">
                    {receipt.branch?.name ? <div>Sucursal: {receipt.branch.name}</div> : null}
                    {receipt.branch?.rfc ? <div>RFC: {receipt.branch.rfc}</div> : null}
                    {address ? <div className="sm:col-span-2">{address}</div> : null}
                    {receipt.branch?.phone ? <div>Tel. {receipt.branch.phone}</div> : null}
                    {receipt.issued_at ? <div>Emitido: {formatIssuedAt(receipt.issued_at)}</div> : null}
                </div>
            </header>

            {receipt.customer ? (
                <section className="border-b border-border bg-secondary px-6 py-4 text-sm text-secondary-foreground">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Cliente bajo Custodia
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                        {receipt.customer.name}
                        {receipt.customer.tax_id ? ` · RFC ${receipt.customer.tax_id}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Datos resguardados conforme al Aviso de Privacidad del comercio.
                    </p>
                </section>
            ) : null}

            <section className="px-6 py-4">
                <table className="w-full table-fixed border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="w-16 py-2">Cant.</th>
                            <th className="py-2">Descripcion</th>
                            <th className="w-24 py-2 text-right">P. Unit.</th>
                            <th className="w-28 py-2 text-right">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(receipt.items ?? []).map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-border/60 align-top text-foreground"
                            >
                                <td className="py-2 tabular-nums">{formatQuantity(item.quantity)}</td>
                                <td className="py-2">
                                    <p className="font-medium">{item.product_name}</p>
                                    <p className="text-xs text-muted-foreground">SKU {item.product_sku}</p>
                                </td>
                                <td className="py-2 text-right tabular-nums">{formatMxn(item.unit_price)}</td>
                                <td className="py-2 text-right tabular-nums font-medium">
                                    {formatMxn(item.line_total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="border-t border-border bg-muted px-6 py-4">
                <dl className="space-y-1 text-sm text-foreground">
                    <div className="flex justify-between">
                        <dt>Subtotal</dt>
                        <dd className="tabular-nums">{formatMxn(receipt.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Impuestos</dt>
                        <dd className="tabular-nums">{formatMxn(receipt.tax_total)}</dd>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
                        <dt>Total MXN</dt>
                        <dd className="tabular-nums">{formatMxn(receipt.total)}</dd>
                    </div>
                </dl>
            </section>

            {(receipt.payments ?? []).length > 0 ? (
                <section className="border-t border-border px-6 py-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Pagos aplicados
                    </p>
                    <ul className="mt-2 space-y-1 text-foreground">
                        {receipt.payments.map((payment, index) => (
                            <li key={`${payment.method}-${index}`} className="flex justify-between">
                                <span>{METHOD_LABELS[payment.method] ?? payment.method}</span>
                                <span className="tabular-nums">{formatMxn(payment.amount)}</span>
                            </li>
                        ))}
                        {change > 0 ? (
                            <li className="flex justify-between">
                                <span>Cambio entregado</span>
                                <span className="tabular-nums">{formatMxn(change)}</span>
                            </li>
                        ) : null}
                        <li className="flex justify-between text-xs text-muted-foreground">
                            <span>Total pagado</span>
                            <span className="tabular-nums">{formatMxn(totalPaid)}</span>
                        </li>
                    </ul>
                </section>
            ) : null}

            <footer className="border-t border-border bg-primary px-6 py-4 text-xs leading-relaxed text-primary-foreground/85">
                <p>
                    Comprobante informativo conforme a la Ley Federal de Proteccion al Consumidor (LFPC).
                    Conserva este ticket para cualquier aclaracion o devolucion segun politica del comercio.
                </p>
                {receipt.branch?.phone ? (
                    <p className="mt-1">Atencion al cliente: {receipt.branch.phone}.</p>
                ) : null}
                <p className="mt-1">PROFECO: 55 5568 8722 · profeco.gob.mx</p>
            </footer>
        </article>
    );
}
