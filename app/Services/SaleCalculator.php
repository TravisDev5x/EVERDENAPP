<?php

namespace App\Services;

use App\Models\Sale;
use App\Support\Money;

class SaleCalculator
{
    /**
     * Recalcula totales sumando centavos enteros para evitar drift entre cliente y servidor (LFPC).
     */
    public function recalculate(Sale $sale): Sale
    {
        $sale->loadMissing('items');

        $subtotalCents = 0;
        $taxCents = 0;
        foreach ($sale->items as $item) {
            $subtotalCents += Money::decimalToCents((string) $item->line_subtotal);
            $taxCents += Money::decimalToCents((string) $item->line_tax_total);
        }

        $sale->update([
            'subtotal' => Money::centsToDecimal($subtotalCents),
            'tax_total' => Money::centsToDecimal($taxCents),
            'total' => Money::centsToDecimal($subtotalCents + $taxCents),
        ]);

        return $sale->fresh(['items']);
    }
}
