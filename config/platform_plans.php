<?php

/**
 * Precios orientativos por plan (MXN / mes) para el panel de plataforma.
 * Los slugs deben coincidir con los que asignas en tenants.plan_slug.
 */
return [

    'currency_code' => 'MXN',

    /**
     * Precio mensual por tenant activo en cada plan (ingreso recurrente estimado).
     * Planes no listados usan {@see default_monthly_mxn}.
     *
     * @var array<string, float|int>
     */
    'monthly_price_mxn' => [
        'standard' => 299,
        'pro' => 599,
        'enterprise' => 1299,
    ],

    /**
     * Precio mensual usado cuando plan_slug no está en monthly_price_mxn.
     */
    'default_monthly_mxn' => 0,

];
