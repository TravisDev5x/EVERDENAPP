<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Models\Branch;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class AcceptInvitationAction
{
    public function execute(TenantInvitation $invitation, string $name, string $password): User
    {
        return DB::transaction(function () use ($invitation, $name, $password): User {
            if ($invitation->isExpired()) {
                throw new \DomainException('Esta invitación ha expirado.');
            }

            if (! $invitation->isPending()) {
                throw new \DomainException('Esta invitación ya no está disponible.');
            }

            $mainBranch = Branch::query()
                ->where('tenant_id', $invitation->tenant_id)
                ->where('is_active', true)
                ->orderByDesc('is_main')
                ->orderBy('id')
                ->first();

            $user = User::query()->create([
                'tenant_id' => $invitation->tenant_id,
                'branch_id' => $mainBranch?->id,
                'role_id' => $invitation->role_id,
                'name' => $name,
                'email' => $invitation->email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            $invitation->forceFill([
                'status' => 'accepted',
                'accepted_at' => now(),
            ])->save();

            return $user;
        });
    }
}
