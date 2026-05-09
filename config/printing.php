<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Agente de impresión (HTTP)
    |--------------------------------------------------------------------------
    |
    | Si PRINT_NOTIFY_AGENT=true y PRINT_AGENT_URL apunta a tu agente local
    | (por ejemplo node scripts/print-agent con --http), Laravel enviará el mismo
    | JSON que se guarda en storage/app/print-outbox/{id}.json.
    |
    */
    'notify_agent' => env('PRINT_NOTIFY_AGENT', false),

    'agent_url' => env('PRINT_AGENT_URL'),

    'agent_secret' => env('PRINT_AGENT_SECRET'),

    'agent_timeout' => (int) env('PRINT_AGENT_TIMEOUT', 5),

    /*
    | Si false, un fallo HTTP al agente hace fallar el job (reintentos de cola).
    | Si true (por defecto), solo se registra en log y el archivo .json sigue disponible.
    */
    'agent_fail_soft' => env('PRINT_AGENT_FAIL_SOFT', true),

    /*
    |----------------------------------------------------------------------
    | Ticket tras cobro (tienda)
    |----------------------------------------------------------------------
    |
    | Si es true, tras un cobro en efectivo exitoso se encola automáticamente
    | el mismo trabajo que el botón «Encolar impresión» en el POS.
    | Requiere cola activa (queue:work) salvo QUEUE_CONNECTION=sync.
    |
    */
    'auto_after_pay' => env('PRINT_AFTER_PAY', false),

];
