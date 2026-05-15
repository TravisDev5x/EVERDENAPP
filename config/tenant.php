<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tenant resolution (subdominio)
    |--------------------------------------------------------------------------
    |
    | En producción el host define el negocio (ej. chocolateria.tudominio.com).
    |
    | En local (http://127.0.0.1:8000, localhost) no hay subdominio real.
    | Define en .env el slug de un tenant existente para simular el contexto:
    |
    |   DEV_TENANT_SLUG=demo-negocio
    |
    | Las rutas /platform/* omiten este slug: para operadores de plataforma
    | el contexto de tenant sigue siendo null en el host local.
    |
    */

    'dev_tenant_slug' => env('DEV_TENANT_SLUG'),

];
