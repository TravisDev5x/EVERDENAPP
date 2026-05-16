<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Mail\InvitationMail;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class SendInvitationAction
{
    public function execute(User $invitedBy, string $email, int $roleId): TenantInvitation
    {
        $tenant = $invitedBy->tenant;
        if (! $tenant instanceof Tenant) {
            throw new \DomainException('No se pudo identificar el negocio.');
        }

        $emailLower = Str::lower(trim($email));

        return DB::transaction(function () use ($invitedBy, $tenant, $emailLower, $roleId): TenantInvitation {
            if (User::query()
                ->where('tenant_id', $tenant->id)
                ->where('email', $emailLower)
                ->exists()) {
                throw new \DomainException('Este correo ya es miembro.');
            }

            $role = Role::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->whereKey($roleId)
                ->first();
            if ($role === null) {
                throw new \DomainException('El rol seleccionado no es válido.');
            }

            $max = $tenant->max_users;
            if ($max !== null) {
                $activeUsers = User::query()
                    ->where('tenant_id', $tenant->id)
                    ->whereNull('suspended_at')
                    ->count();
                $pendingInvites = TenantInvitation::withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'pending')
                    ->count();
                if (($activeUsers + $pendingInvites) >= $max) {
                    throw new \DomainException('Límite de usuarios alcanzado.');
                }
            }

            TenantInvitation::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('email', $emailLower)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            $invitation = TenantInvitation::withoutGlobalScopes()->create([
                'tenant_id' => $tenant->id,
                'email' => $emailLower,
                'role_id' => $role->id,
                'invited_by' => $invitedBy->id,
                'token' => Str::random(64),
                'status' => 'pending',
                'expires_at' => now()->addHours(72),
            ]);

            try {
                Mail::to($emailLower)->send(new InvitationMail($invitation));
            } catch (\Throwable $e) {
                report($e);
            }

            return $invitation;
        });
    }
}
