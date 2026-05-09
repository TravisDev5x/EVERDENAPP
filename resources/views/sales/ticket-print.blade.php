<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ticket #{{ str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.35;
            margin: 0 auto;
            padding: 12px;
            max-width: 80mm;
            color: #111;
        }
        h1 {
            font-size: 14px;
            margin: 0 0 4px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .center { text-align: center; }
        .muted { color: #555; font-size: 11px; }
        .small { font-size: 10px; }
        hr.dashed { border: 0; border-top: 1px dashed #333; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 4px 0 0; }
        th, td { padding: 2px 0; vertical-align: top; }
        th { font-weight: 600; }
        .qty { width: 2.4rem; text-align: right; }
        .price { width: 4.2rem; text-align: right; white-space: nowrap; }
        .money { text-align: right; white-space: nowrap; }
        .totals-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .grand { font-weight: bold; font-size: 14px; margin-top: 6px; }
        .legal {
            margin-top: 12px;
            border-top: 1px dashed #333;
            padding-top: 8px;
            font-size: 10px;
            color: #444;
            text-align: center;
            line-height: 1.45;
        }
        @media print {
            body { padding: 4px; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    @php
        $tenant = $sale->tenant;
        $branch = $sale->branch;
        $tradeName = $tenant?->trade_name ?: $tenant?->name ?? config('app.name');
        $legalName = $tenant?->name && $tenant?->trade_name && $tenant->name !== $tenant->trade_name
            ? $tenant->name
            : null;
        $branchAddressParts = collect([
            $branch?->address,
            $branch?->neighborhood,
            $branch?->city,
            $branch?->state,
            $branch?->postal_code ? "C.P. {$branch->postal_code}" : null,
        ])->filter()->implode(' · ');
        $folio = str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT);
        $issuedAt = $sale->confirmed_at ?? $sale->created_at;
        $issuedAtLabel = $issuedAt?->timezone(config('app.timezone'))->format('d/m/Y H:i');
        $payments = $sale->payments ?? collect();
        $cashPaid = $payments->where('method', 'cash')->sum('amount');
        $totalPaid = $payments->sum('amount');
        $changeGiven = max(0, (float) $cashPaid - (float) $sale->total);
        $customer = $sale->customer ?? null;
        $methodLabels = [
            'cash' => 'Efectivo',
            'card' => 'Tarjeta',
            'transfer' => 'Transferencia',
        ];
    @endphp

    <h1>{{ $tradeName }}</h1>
    @if ($legalName)
        <p class="muted center" style="margin:0 0 2px;">Razón social: {{ $legalName }}</p>
    @endif
    @if ($branch?->rfc)
        <p class="muted center" style="margin:0 0 2px;">RFC: {{ $branch->rfc }}</p>
    @endif
    @if ($branch?->name)
        <p class="muted center" style="margin:0 0 2px;">Sucursal: {{ $branch->name }}</p>
    @endif
    @if ($branchAddressParts !== '')
        <p class="muted center" style="margin:0 0 2px;">{{ $branchAddressParts }}</p>
    @endif
    @if ($branch?->phone)
        <p class="muted center" style="margin:0 0 2px;">Tel. {{ $branch->phone }}</p>
    @endif

    <hr class="dashed">

    <p class="muted center" style="margin:0;">
        Ticket #{{ $folio }} · {{ $issuedAtLabel }}
    </p>
    <p class="muted center" style="margin:2px 0 0;">
        Estado: {{ $sale->status }} · Pago: {{ $sale->payment_status }}
    </p>

    @if ($customer)
        <p class="muted center" style="margin:6px 0 0;">
            Cliente: {{ $customer->name }}
            @if ($customer->tax_id) · RFC {{ $customer->tax_id }} @endif
        </p>
        <p class="small center" style="margin:0; color:#777;">
            Datos en Custodia conforme al Aviso de Privacidad.
        </p>
    @endif

    <hr class="dashed">

    <table>
        <thead>
            <tr>
                <th class="qty">Cant.</th>
                <th>Descripción</th>
                <th class="price">P. Unit.</th>
                <th class="money">Importe</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $item)
                <tr>
                    <td class="qty">{{ rtrim(rtrim(number_format((float) $item->quantity, 3, '.', ''), '0'), '.') }}</td>
                    <td>
                        {{ $item->product_name }}<br>
                        <span class="muted small">{{ $item->product_sku }}</span>
                    </td>
                    <td class="price">${{ number_format((float) $item->unit_price, 2, '.', ',') }}</td>
                    <td class="money">${{ number_format((float) $item->line_total, 2, '.', ',') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <hr class="dashed">

    <div>
        <div class="totals-row">
            <span>Subtotal</span>
            <span>${{ number_format((float) $sale->subtotal, 2, '.', ',') }}</span>
        </div>
        <div class="totals-row">
            <span>Impuestos</span>
            <span>${{ number_format((float) $sale->tax_total, 2, '.', ',') }}</span>
        </div>
        <div class="totals-row grand">
            <span>TOTAL MXN</span>
            <span>${{ number_format((float) $sale->total, 2, '.', ',') }}</span>
        </div>
    </div>

    @if ($payments->isNotEmpty())
        <hr class="dashed">
        <p class="muted" style="margin:0 0 2px;">Pagos aplicados</p>
        @foreach ($payments as $payment)
            <div class="totals-row">
                <span>{{ $methodLabels[$payment->method] ?? $payment->method }}</span>
                <span>${{ number_format((float) $payment->amount, 2, '.', ',') }}</span>
            </div>
        @endforeach
        @if ($changeGiven > 0)
            <div class="totals-row">
                <span>Cambio entregado</span>
                <span>${{ number_format($changeGiven, 2, '.', ',') }}</span>
            </div>
        @endif
        <div class="totals-row muted small">
            <span>Total pagado</span>
            <span>${{ number_format((float) $totalPaid, 2, '.', ',') }}</span>
        </div>
    @endif

    <div class="legal">
        Comprobante para fines informativos conforme a la LFPC.
        Conserva este ticket para cualquier aclaración o devolución según política del comercio.
        @if ($branch?->phone)
            <br>Atención al cliente: {{ $branch->phone }}.
        @endif
        <br>PROFECO: 55 5568 8722 · profeco.gob.mx
    </div>

    <div class="no-print" style="margin-top:16px;text-align:center;">
        <button type="button" onclick="window.print()" style="padding:10px 16px;font-size:14px;cursor:pointer;">
            Imprimir / Guardar PDF
        </button>
    </div>

    @if ($autoprint ?? false)
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () { window.print(); }, 200);
            });
        </script>
    @endif
</body>
</html>
