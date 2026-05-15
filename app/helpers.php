<?php

declare(strict_types=1);

use App\Models\Tenant;

/**
 * Tenant resuelto por IdentifyTenant (subdominio o DEV_TENANT_SLUG en local).
 * En rutas sin tenant (landing, platform en host sin subdominio) no está enlazado.
 */
function currentTenant(): ?Tenant
{
    if (! app()->bound('currentTenant')) {
        return null;
    }

    $tenant = app('currentTenant');

    return $tenant instanceof Tenant ? $tenant : null;
}

function currentTenantId(): int
{
    $tenant = currentTenant();
    if ($tenant === null) {
        throw new RuntimeException('Current tenant is not bound.');
    }

    return (int) $tenant->id;
}
