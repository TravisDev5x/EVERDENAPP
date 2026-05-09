<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TenantRoleBootstrap
{
    /**
     * Inserta el catálogo global de permisos (idempotente).
     */
    public function syncPermissionCatalog(): void
    {
        foreach (Permissions::definitions() as $row) {
            Permission::query()->firstOrCreate(
                ['key' => $row['key']],
                [
                    'group' => $row['group'],
                    'label' => $row['label'],
                    'sort_order' => $row['sort_order'],
                ]
            );
        }
    }

    /**
     * Crea los cuatro roles de sistema por tenant y sus permisos por defecto.
     */
    public function ensureSystemRolesForTenant(Tenant $tenant): void
    {
        $specs = [
            'owner' => [
                'name' => 'Propietario',
                'description' => 'Control total del tenant.',
                'keys' => Permissions::allKeys(),
            ],
            'admin' => [
                'name' => 'Administrador',
                'description' => 'Gestión amplia del negocio.',
                'keys' => Permissions::allKeys(),
            ],
            'supervisor' => [
                'name' => 'Supervisor',
                'description' => 'Operación de piso e inventario; sin administración de catálogo, sucursales ni equipo.',
                'keys' => [
                    Permissions::CATALOG_PRODUCTS_VIEW,
                    Permissions::BRANCHES_VIEW,
                    Permissions::INVENTORY_VIEW,
                    Permissions::INVENTORY_MANAGE,
                    Permissions::SALES_OPERATE,
                    Permissions::PAYMENTS_CASH,
                    Permissions::CASH_SESSION,
                    Permissions::FINANCE_VIEW,
                    Permissions::REPORTS_VIEW,
                    Permissions::TEAM_USERS_VIEW,
                    Permissions::TEAM_ROLES_VIEW,
                ],
            ],
            'cajero' => [
                'name' => 'Cajero',
                'description' => 'Mostrador, ventas y caja.',
                'keys' => [
                    Permissions::CATALOG_PRODUCTS_VIEW,
                    Permissions::BRANCHES_VIEW,
                    Permissions::INVENTORY_VIEW,
                    Permissions::SALES_OPERATE,
                    Permissions::PAYMENTS_CASH,
                    Permissions::CASH_SESSION,
                    Permissions::REPORTS_VIEW,
                ],
            ],
        ];

        foreach ($specs as $slug => $meta) {
            $role = Role::withoutGlobalScopes()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'slug' => $slug],
                [
                    'name' => $meta['name'],
                    'description' => $meta['description'],
                    'is_system' => true,
                ]
            );

            $ids = Permission::query()
                ->whereIn('key', $meta['keys'])
                ->pluck('id')
                ->all();
            $role->permissions()->sync($ids);
        }
    }

    /**
     * Migra la columna legacy `users.role` (string) a `role_id`.
     */
    public function migrateUsersFromLegacyRoleColumn(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        $rows = DB::table('users')
            ->whereNotNull('tenant_id')
            ->whereNull('role_id')
            ->get(['id', 'tenant_id', 'role']);

        foreach ($rows as $row) {
            $slug = is_string($row->role) && $row->role !== '' ? $row->role : 'cajero';
            $roleId = DB::table('roles')
                ->where('tenant_id', $row->tenant_id)
                ->where('slug', $slug)
                ->value('id');

            if ($roleId) {
                DB::table('users')->where('id', $row->id)->update(['role_id' => $roleId]);
            }
        }
    }

    public function ownerRoleForTenant(Tenant $tenant): ?Role
    {
        return Role::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'owner')
            ->first();
    }
}
