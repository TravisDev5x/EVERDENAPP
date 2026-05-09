<?php

use App\Models\Tenant;
use App\Services\TenantRoleBootstrap;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();

        foreach (Tenant::query()->cursor() as $tenant) {
            $bootstrap->ensureSystemRolesForTenant($tenant);
        }
    }

    public function down(): void
    {
        // El catálogo RBAC se conserva para evitar dejar roles existentes en estado inconsistente.
    }
};
