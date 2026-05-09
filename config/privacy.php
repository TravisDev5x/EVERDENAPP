<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Responsable del tratamiento (contacto ARCO / privacidad)
    |--------------------------------------------------------------------------
    */
    'contact_email' => env('PRIVACY_CONTACT_EMAIL', env('MAIL_FROM_ADDRESS', 'privacy@example.com')),

    'organization_name' => env('PRIVACY_ORGANIZATION_NAME', env('APP_NAME', 'Laravel')),

    'customer_notice_version' => env('PRIVACY_CUSTOMER_NOTICE_VERSION', 'everden-mx-v1'),

    /*
    |--------------------------------------------------------------------------
    | Periodos de conservación orientativos (días)
    |--------------------------------------------------------------------------
    |
    | Valores de referencia para políticas y registros de tratamiento (LFPDPPP /
    | ISO 27701). La aplicación puede usar estos valores en jobs de purga futuros.
    |
    */
    'retention_days' => [
        'audit_logs' => (int) env('PRIVACY_RETENTION_AUDIT_LOGS_DAYS', 730),
        'session_idle_timeout_minutes' => (int) env('SESSION_LIFETIME', 120), // alinear con config/session.php
        'inventory_movements' => env('PRIVACY_RETENTION_INVENTORY_MOVEMENTS_DAYS'), // null = indefinido operativo
        'finance_journal' => env('PRIVACY_RETENTION_FINANCE_JOURNAL_DAYS'),
    ],

];
