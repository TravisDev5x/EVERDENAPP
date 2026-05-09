<?php

use App\Models\Tenant;
use App\Services\TenantRoleBootstrap;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();

        foreach (Tenant::query()->cursor() as $tenant) {
            $bootstrap->ensureSystemRolesForTenant($tenant);
        }

        $bootstrap->migrateUsersFromLegacyRoleColumn();

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('cajero')->after('password');
        });

        // No restauramos permisos por rol; los datos RBAC permanecen.
    }
};
