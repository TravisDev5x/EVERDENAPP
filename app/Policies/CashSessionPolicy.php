<?php

namespace App\Policies;

use App\Models\CashSession;
use App\Models\User;
use App\Support\Permissions;

class CashSessionPolicy
{
    public function open(User $user): bool
    {
        return $user->hasPermission(Permissions::CASH_SESSION);
    }

    public function close(User $user, CashSession $cashSession): bool
    {
        return $cashSession->tenant_id === $user->tenant_id
            && $cashSession->isOpen()
            && $cashSession->user_id === $user->id
            && $user->hasPermission(Permissions::CASH_SESSION);
    }
}
