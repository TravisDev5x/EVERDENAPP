<?php

namespace Database\Seeders;

use App\Domain\Cashier\BranchCashRegisterBootstrap;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantRoleBootstrap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /** @var TenantRoleBootstrap $bootstrap */
        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-tenant'],
            ['name' => 'Demo Tenant', 'is_active' => true]
        );

        $bootstrap->ensureSystemRolesForTenant($tenant);

        $users = [
            ['name' => 'Owner Demo', 'email' => 'owner@demo.local', 'slug' => 'owner'],
            ['name' => 'Admin Demo', 'email' => 'admin@demo.local', 'slug' => 'admin'],
            ['name' => 'Supervisor Demo', 'email' => 'supervisor@demo.local', 'slug' => 'supervisor'],
            ['name' => 'Cajero Demo', 'email' => 'cajero@demo.local', 'slug' => 'cajero'],
        ];

        $mainBranch = Branch::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Sucursal Matriz'],
            ['is_main' => true, 'is_active' => true]
        );

        app(BranchCashRegisterBootstrap::class)->ensureDefaults($mainBranch);

        CashRegister::firstOrCreate(
            ['branch_id' => $mainBranch->id, 'code' => 'caja-2'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Caja 2',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        foreach ($users as $attributes) {
            $slug = $attributes['slug'];
            unset($attributes['slug']);

            $role = Role::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $slug)
                ->first();

            $roleId = $role?->id;

            $user = User::updateOrCreate(
                ['tenant_id' => $tenant->id, 'email' => $attributes['email']],
                [
                    'name' => $attributes['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'role_id' => $roleId,
                ]
            );

            if (! $user->branch_id) {
                $user->forceFill([
                    'branch_id' => $mainBranch->id,
                ])->save();
            }
        }
    }
}
