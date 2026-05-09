<?php

namespace App\Support;

class Money
{
    public static function decimalToCents(string|int|float $value): int
    {
        $normalized = preg_replace('/[^0-9\.\-]/', '', (string) $value) ?? '0';
        if ($normalized === '' || $normalized === '-') {
            return 0;
        }

        $negative = str_starts_with($normalized, '-');
        $normalized = ltrim($normalized, '-');

        [$whole, $fraction] = array_pad(explode('.', $normalized, 2), 2, '0');
        $fraction = substr(str_pad($fraction, 3, '0'), 0, 3);

        $cents = ((int) $whole * 100) + (int) substr($fraction, 0, 2);
        $third = (int) $fraction[2];
        if ($third >= 5) {
            $cents++;
        }

        return $negative ? -$cents : $cents;
    }

    public static function centsToDecimal(int $cents): string
    {
        $negative = $cents < 0;
        $cents = abs($cents);

        $whole = intdiv($cents, 100);
        $fraction = $cents % 100;
        $value = sprintf('%d.%02d', $whole, $fraction);

        return $negative ? "-{$value}" : $value;
    }

    /**
     * Formatea un decimal monetario (string|float) en MXN respetando es-MX (separador de miles ',', decimal '.').
     */
    public static function formatMxn(string|int|float $value): string
    {
        $cents = self::decimalToCents($value);
        $negative = $cents < 0;
        $cents = abs($cents);

        $whole = intdiv($cents, 100);
        $fraction = $cents % 100;
        $wholeFormatted = number_format($whole, 0, '.', ',');

        $formatted = sprintf('$%s.%02d MXN', $wholeFormatted, $fraction);

        return $negative ? "-{$formatted}" : $formatted;
    }

    public static function taxCents(int $baseCents, string|int|float $taxRate): int
    {
        $rateBasisPoints = self::rateToBasisPoints($taxRate);
        $numerator = $baseCents * $rateBasisPoints;

        return intdiv($numerator + 5000, 10000);
    }

    private static function rateToBasisPoints(string|int|float $rate): int
    {
        $normalized = preg_replace('/[^0-9\.\-]/', '', (string) $rate) ?? '0';
        if ($normalized === '' || $normalized === '-') {
            return 0;
        }

        [$whole, $fraction] = array_pad(explode('.', $normalized, 2), 2, '0');
        $fraction = substr(str_pad($fraction, 2, '0'), 0, 2);

        return ((int) $whole * 100) + (int) $fraction;
    }
}
