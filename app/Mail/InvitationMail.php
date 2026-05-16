<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\TenantInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly TenantInvitation $invitation,
    ) {}

    public function envelope(): Envelope
    {
        $this->invitation->loadMissing(['tenant', 'role', 'invitedBy']);
        $tenantName = $this->invitation->tenant?->name ?? 'EVERDEN';

        return new Envelope(
            subject: "Te invitaron a {$tenantName} en EVERDEN",
        );
    }

    public function content(): Content
    {
        $this->invitation->loadMissing(['tenant', 'role', 'invitedBy']);

        return new Content(
            view: 'emails.invitation',
            with: [
                'tenantName' => $this->invitation->tenant?->name ?? 'EVERDEN',
                'invitedByName' => $this->invitation->invitedBy?->name ?? 'Un administrador',
                'roleName' => $this->invitation->role?->name ?? 'Miembro',
                'acceptUrl' => route('invitations.accept', $this->invitation->token),
            ],
        );
    }
}
