<?php

namespace App\Actions\Auth;

use App\Domain\Billing\TenantPlanService;
use App\Domain\Cashier\BranchCashRegisterBootstrap;
use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantRoleBootstrap;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterTenantOwnerAction
{
    /**
     * Crea tenant, sucursal matriz y usuario propietario (registro clásico u OAuth).
     * Todo ocurre en una sola transacción de base de datos.
     *
     * @param  array{name: string, business_name: string, email: string, password?: string|null, google_id?: string|null, avatar?: string|null, email_verified_at?: \Illuminate\Support\Carbon|null, main_branch_name?: string|null}  $data
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $baseSlug = Str::slug((string) $data['business_name']);
            $slugRoot = $baseSlug !== '' ? $baseSlug : 'negocio';
            $slug = $slugRoot;
            $counter = 1;

            while (Tenant::query()->where('slug', $slug)->exists()) {
                $counter++;
                $slug = "{$slugRoot}-{$counter}";
            }

            $tenant = Tenant::create([
                'name' => $data['business_name'],
                'slug' => $slug,
                'country_code' => 'MX',
                'currency_code' => 'MXN',
                'timezone' => 'America/Mexico_City',
                'is_active' => true,
            ]);

            /** @var TenantRoleBootstrap $roleBootstrap */
            $roleBootstrap = app(TenantRoleBootstrap::class);
            $roleBootstrap->syncPermissionCatalog();
            $roleBootstrap->ensureSystemRolesForTenant($tenant);
            $ownerRole = $roleBootstrap->ownerRoleForTenant($tenant);
            abort_if(! $ownerRole, 500, 'No se pudo crear el rol de propietario.');

            $mainBranchLabel = trim((string) ($data['main_branch_name'] ?? ''));
            if ($mainBranchLabel === '') {
                $mainBranchLabel = 'Sucursal Matriz';
            }

            $mainBranch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => Str::limit($mainBranchLabel, 255, ''),
                'is_main' => true,
                'is_active' => true,
            ]);

            app(BranchCashRegisterBootstrap::class)->ensureDefaults($mainBranch);

            app(TenantPlanService::class)->assertCanCreateUser($tenant);

            $passwordPlain = $data['password'] ?? null;

            $attributes = [
                'tenant_id' => $tenant->id,
                'branch_id' => $mainBranch->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'role_id' => $ownerRole->id,
                'google_id' => $data['google_id'] ?? null,
                'avatar' => $data['avatar'] ?? null,
                'email_verified_at' => $data['email_verified_at'] ?? null,
            ];

            if ($passwordPlain !== null && $passwordPlain !== '') {
                $attributes['password'] = Hash::make($passwordPlain);
            }

            $user = User::create($attributes);

            return $user;
        });
    }
}
