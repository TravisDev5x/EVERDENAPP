<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantRoleBootstrap;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role_id' => null,
            'is_platform_operator' => false,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Asigna un rol de sistema por slug después de crear el usuario (tenant debe existir).
     *
     * @return $this
     */
    /**
     * Operador de plataforma (sin tenant ni RBAC de negocio).
     *
     * @return $this
     */
    public function platformOperator(): static
    {
        return $this->state(fn (array $attributes): array => [
            'tenant_id' => null,
            'branch_id' => null,
            'role_id' => null,
            'is_platform_operator' => true,
        ]);
    }

    public function forRoleSlug(string $slug): static
    {
        return $this->afterCreating(function (User $user) use ($slug): void {
            $tenant = Tenant::query()->find($user->tenant_id);
            if (! $tenant instanceof Tenant) {
                return;
            }

            $bootstrap = app(TenantRoleBootstrap::class);
            $bootstrap->syncPermissionCatalog();
            $bootstrap->ensureSystemRolesForTenant($tenant);

            $role = Role::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $slug)
                ->first();

            if ($role) {
                $user->forceFill(['role_id' => $role->id])->save();
            }
        });
    }

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            if ($user->is_platform_operator) {
                return;
            }

            if ($user->role_id !== null) {
                return;
            }

            $tenant = Tenant::query()->find($user->tenant_id);
            if (! $tenant instanceof Tenant) {
                return;
            }

            $bootstrap = app(TenantRoleBootstrap::class);
            $bootstrap->syncPermissionCatalog();
            $bootstrap->ensureSystemRolesForTenant($tenant);

            $role = Role::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('slug', 'admin')
                ->first();

            if ($role) {
                $user->forceFill(['role_id' => $role->id])->save();
            }
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
