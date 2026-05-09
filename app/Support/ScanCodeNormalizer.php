<?php

namespace App\Support;

/**
 * Convierte lecturas de pistola (SKU plano o QR con URL) en candidatos para resolver producto.
 */
final class ScanCodeNormalizer
{
    /**
     * Genera una lista ordenada de cadenas a probar contra el SKU del catálogo.
     * Prioridad: texto crudo, parámetros típicos de query (?sku=, ?code=…), segmentos de ruta.
     *
     * @return list<string>
     */
    public static function candidateCodes(string $raw): array
    {
        $raw = trim($raw);
        if ($raw === '') {
            return [];
        }

        $out = [$raw];

        if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
            $parts = parse_url($raw);
            if (is_array($parts)) {
                $query = [];
                if (! empty($parts['query']) && is_string($parts['query'])) {
                    parse_str($parts['query'], $query);
                }

                foreach (['sku', 'code', 'c', 'product', 'p', 'barcode', 'ean', 'id'] as $key) {
                    if (! empty($query[$key]) && is_string($query[$key])) {
                        $out[] = trim(rawurldecode($query[$key]));
                    }
                }

                $path = $parts['path'] ?? '';
                $path = trim((string) $path, '/');
                if ($path !== '') {
                    foreach (explode('/', $path) as $segment) {
                        $segment = trim(rawurldecode($segment));
                        if ($segment !== '') {
                            $out[] = $segment;
                        }
                    }
                }
            }
        }

        $filtered = [];
        foreach ($out as $s) {
            $s = trim($s);
            if ($s !== '' && ! in_array($s, $filtered, true)) {
                $filtered[] = $s;
            }
        }

        return $filtered;
    }
}
