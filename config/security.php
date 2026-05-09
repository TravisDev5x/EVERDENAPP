<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Forzar HTTPS
    |--------------------------------------------------------------------------
    |
    | En producción debe estar activo detrás de TLS. Redirige peticiones HTTP
    | y alinea con controles ISO 27001 (A.8 / cifrado en tránsito).
    |
    */
    'force_https' => (bool) env('APP_FORCE_HTTPS', false),

    /*
    |--------------------------------------------------------------------------
    | Cabeceras de seguridad HTTP
    |--------------------------------------------------------------------------
    */
    'headers_enabled' => (bool) env('SECURITY_HEADERS_ENABLED', true),

    'hsts_max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000),
    'hsts_include_subdomains' => (bool) env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', true),
    'hsts_preload' => (bool) env('SECURITY_HSTS_PRELOAD', false),

    /*
    | Content-Security-Policy estricta solo recomendada en producción.
    | En local suele interferir con Vite HMR; por defecto se omite CSP fuera de production.
    */
    'csp_in_non_production' => (bool) env('SECURITY_CSP_IN_NON_PRODUCTION', false),

];
