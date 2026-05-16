<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Models\TenantInvitation;

final class RejectInvitationAction
{
    public function execute(TenantInvitation $invitation, string $reason): void
    {
        if ($invitation->isExpired()) {
            throw new \DomainException('Esta invitación ha expirado.');
        }

        if (! $invitation->isPending()) {
            throw new \DomainException('Esta invitación ya no está disponible.');
        }

        $invitation->forceFill([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'rejected_at' => now(),
        ])->save();
    }
}
