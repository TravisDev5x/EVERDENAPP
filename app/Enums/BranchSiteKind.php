<?php

namespace App\Enums;

/**
 * Formato físico del punto de venta. La unidad operativa sigue siendo {@see \App\Models\Branch};
 * esto solo clasifica el contexto logístico (tienda cerrada, isla en CC, módulo en transporte).
 */
enum BranchSiteKind: string
{
    case Standalone = 'standalone';
    case MallIsland = 'mall_island';
    case TransitKiosk = 'transit_kiosk';

    public function label(): string
    {
        return match ($this) {
            self::Standalone => 'Sucursal / tienda',
            self::MallIsland => 'Isla (centro comercial)',
            self::TransitKiosk => 'Módulo (transporte / paradero)',
        };
    }
}
