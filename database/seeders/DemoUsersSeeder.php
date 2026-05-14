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

/**
 * Usuarios de demostración (ejecutar: php artisan db:seed).
 *
 * Contraseña por defecto de los tres: {@see self::defaultPassword()}
 */
class DemoUsersSeeder extends Seeder
{
    private const TENANT_SLUG = 'demo-negocio';

    public static function defaultPassword(): string
    {
        $fromEnv = env('DEMO_USERS_PASSWORD');

        return is_string($fromEnv) && $fromEnv !== '' ? $fromEnv : 'password';
    }

    public function run(): void
    {
        /** @var TenantRoleBootstrap $bootstrap */
        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();

        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => self::TENANT_SLUG],
            [
                'name' => 'Negocio demo',
                'trade_name' => 'Negocio demo',
                'is_active' => true,
            ]
        );

        $bootstrap->ensureSystemRolesForTenant($tenant);

        $mainBranch = Branch::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Sucursal Matriz'],
            ['is_main' => true, 'is_active' => true]
        );

        app(BranchCashRegisterBootstrap::class)->ensureDefaults($mainBranch);

        CashRegister::query()->firstOrCreate(
            ['branch_id' => $mainBranch->id, 'code' => 'caja-2'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Caja 2',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        $password = Hash::make(self::defaultPassword());

        $adminRole = Role::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'admin')
            ->firstOrFail();

        $cajeroRole = Role::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'cajero')
            ->firstOrFail();

        User::query()->updateOrCreate(
            ['email' => 'superadmin@demo.local'],
            [
                'name' => 'Super administrador',
                'password' => $password,
                'tenant_id' => null,
                'branch_id' => null,
                'role_id' => null,
                'is_platform_operator' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->upsertTenantUser(
            $tenant,
            $mainBranch,
            'adminnegocio@demo.local',
            'Administrador del negocio',
            $adminRole->id,
            $password
        );

        $this->upsertTenantUser(
            $tenant,
            $mainBranch,
            'cajero@demo.local',
            'Cajero',
            $cajeroRole->id,
            $password
        );
    }

    private function upsertTenantUser(
        Tenant $tenant,
        Branch $branch,
        string $email,
        string $name,
        int $roleId,
        string $hashedPassword,
    ): void {
        $user = User::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'email' => $email],
            [
                'name' => $name,
                'password' => $hashedPassword,
                'role_id' => $roleId,
                'email_verified_at' => now(),
                'is_platform_operator' => false,
            ]
        );

        if (! $user->branch_id) {
            $user->forceFill(['branch_id' => $branch->id])->save();
        }
    }
}
