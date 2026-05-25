<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['tenant_id', 'branch_id', 'role_id', 'name', 'email', 'password', 'google_id', 'avatar', 'phone', 'whatsapp', 'employee_number', 'birth_date', 'hire_date', 'cash_pin', 'pin_set_at', 'is_platform_operator', 'suspended_at', 'suspension_reason'])]
#[Hidden(['password', 'remember_token', 'cash_pin'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'hire_date' => 'date',
            'pin_set_at' => 'datetime',
            'is_platform_operator' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }

    public function hasPin(): bool
    {
        return ! empty($this->cash_pin);
    }

    public function verifyPin(string $pin): bool
    {
        if (! $this->cash_pin) {
            return false;
        }

        return \Illuminate\Support\Facades\Hash::check($pin, $this->cash_pin);
    }

    public function setPin(string $pin): void
    {
        $this->update([
            'cash_pin' => \Illuminate\Support\Facades\Hash::make($pin),
            'pin_set_at' => now(),
        ]);
    }

    public function clearPin(): void
    {
        $this->update([
            'cash_pin' => null,
            'pin_set_at' => null,
        ]);
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Rol RBAC del usuario dentro del tenant.
     *
     * @return BelongsTo<Role, $this>
     */
    public function tenantRole(): BelongsTo
    {
        // Sin scope de tenant: la FK ya fija el rol; el scope global depende del TenantContext y puede
        // desincronizarse entre peticiones (p. ej. tests con varios usuarios / tenants).
        return $this->belongsTo(Role::class, 'role_id')->withoutGlobalScopes();
    }

    /**
     * Compatibilidad con comprobaciones por slug de rol de sistema.
     */
    public function hasRole(string ...$slugs): bool
    {
        $slug = $this->tenantRole?->slug;

        return $slug !== null && in_array($slug, $slugs, true);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->role_id === null) {
            return false;
        }

        if (! $this->relationLoaded('tenantRole')) {
            $this->load('tenantRole.permissions');
        }

        $role = $this->tenantRole;
        if ($role === null || (int) $role->tenant_id !== (int) $this->tenant_id) {
            return false;
        }

        return $role->permissions->contains('key', $permission);
    }

    /**
     * @param  list<string>  $permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPassword($token));
    }
}
