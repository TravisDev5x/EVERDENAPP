<?php

declare(strict_types=1);

namespace App\Actions\Team;

use App\Mail\InvitationMail;
use App\Models\TenantInvitation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class ResendInvitationAction
{
    public function execute(TenantInvitation $invitation): void
    {
        if (! $invitation->canResend()) {
            throw new \DomainException('Debes esperar al menos 10 minutos antes de reenviar.');
        }

        if (! $invitation->isPending()) {
            throw new \DomainException('Solo se pueden reenviar invitaciones pendientes.');
        }

        $invitation->forceFill([
            'token' => Str::random(64),
            'expires_at' => now()->addHours(72),
            'resend_count' => (int) $invitation->resend_count + 1,
            'resent_at' => now(),
        ])->save();

        try {
            Mail::to($invitation->email)->send(new InvitationMail($invitation));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
