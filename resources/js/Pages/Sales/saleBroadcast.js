/**
 * Carga mínima del ticket para BroadcastChannel (pantalla cliente / sincronización).
 * @param {object|null} s
 */
export function salePayloadForBroadcast(s) {
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
