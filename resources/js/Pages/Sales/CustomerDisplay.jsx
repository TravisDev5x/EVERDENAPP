import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function formatMoney(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function CustomerDisplay({
    sale: initialSale,
    storeTitle,
    branchName,
    displayStateUrl,
    displayPollIntervalMs = 2500,
}) {
    const [sale, setSale] = useState(initialSale);
    const [pollStatus, setPollStatus] = useState('listo');

    useEffect(() => {
        setSale(initialSale);
    }, [initialSale]);

    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined' || !initialSale?.id) {
            return undefined;
        }
        const channel = new BroadcastChannel(`pos-sale-${initialSale.id}`);
        channel.onmessage = (ev) => {
            if (ev?.data?.type === 'sale-update' && ev.data.sale) {
                setSale(ev.data.sale);
            }
        };
        return () => channel.close();
    }, [initialSale?.id]);

    useEffect(() => {
        if (!displayStateUrl || displayPollIntervalMs <= 0) {
            return undefined;
        }

        const interval = setInterval(async () => {
            try {
                setPollStatus('sincronizando…');
                const res = await fetch(displayStateUrl, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                if (!res.ok) {
                    setPollStatus('sin conexión');
                    return;
                }
                const data = await res.json();
                if (data?.sale) {
                    setSale(data.sale);
                }
                setPollStatus('sincronizado');
            } catch {
                setPollStatus('sin conexión');
            }
        }, displayPollIntervalMs);

        return () => clearInterval(interval);
    }, [displayStateUrl, displayPollIntervalMs]);

    return (
        <>
            <Head title="Pantalla cliente" />

            <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
                <header className="border-b border-white/10 px-6 py-4 text-center sm:py-6">
                    <p className="text-sm font-medium uppercase tracking-widest text-slate-300">
                        {storeTitle}
                    </p>
                    {branchName ? (
                        <p className="mt-1 text-lg text-slate-400 sm:text-xl">{branchName}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">Total a pagar</p>
                    {displayStateUrl ? (
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-600" aria-live="polite">
                            Red: {pollStatus}
                        </p>
                    ) : null}
                </header>

                <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
                    <p
                        className="text-center font-black tabular-nums tracking-tight text-white"
                        style={{ fontSize: 'clamp(3rem, 14vw, 9rem)', lineHeight: 1 }}
                    >
                        {formatMoney(sale.total)}
                    </p>
                    <p className="mt-6 max-w-xl text-center text-sm text-slate-500">
                        Los importes son orientativos hasta confirmar el cobro en caja.
                    </p>
                </main>

                <section className="max-h-[40vh] overflow-y-auto border-t border-white/10 bg-black/30 px-4 py-4 sm:max-h-[35vh]">
                    <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Artículos
                    </h2>
                    {sale.items?.length ? (
                        <ul className="mx-auto max-w-lg space-y-2">
                            {sale.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-start justify-between gap-4 rounded-lg bg-white/5 px-3 py-2 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-white">{item.product_name}</p>
                                        <p className="text-xs text-slate-500">{item.product_sku}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="tabular-nums text-slate-300">
                                            × {item.quantity}
                                        </p>
                                        <p className="tabular-nums text-slate-200">
                                            {formatMoney(item.line_total)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-slate-500">Aún no hay productos en este ticket.</p>
                    )}
                </section>

                <footer className="border-t border-white/10 px-4 py-3 text-center text-xs text-slate-600">
                    Segunda pantalla o tablet en la misma red: inicia sesión y abre esta URL. Se actualiza por{' '}
                    <strong className="text-slate-500">polling</strong> cada pocos segundos y, si es la misma PC,
                    también por canal rápido entre ventanas.
                </footer>
            </div>
        </>
    );
}
