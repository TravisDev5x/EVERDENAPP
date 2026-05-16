<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\TenantInvitation;
use Illuminate\Console\Command;

final class ExpireInvitationsCommand extends Command
{
    protected $signature = 'invitations:expire';

    protected $description = 'Marca como expiradas las invitaciones vencidas';

    public function handle(): int
    {
        $count = TenantInvitation::withoutGlobalScopes()
            ->where('status', 'pending')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        $this->info("{$count} invitaciones marcadas como expiradas.");

        return self::SUCCESS;
    }
}
