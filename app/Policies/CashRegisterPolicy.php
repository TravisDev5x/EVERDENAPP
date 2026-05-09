<?php

namespace App\Policies;

use App\Models\CashRegister;
use App\Models\User;
use App\Support\Permissions;

class CashRegisterPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::BRANCHES_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::BRANCHES_MANAGE);
    }

    public function update(User $user, CashRegister $cashRegister): bool
    {
        return (int) $user->tenant_id === (int) $cashRegister->tenant_id
            && $user->hasPermission(Permissions::BRANCHES_MANAGE);
    }

    public function delete(User $user, CashRegister $cashRegister): bool
    {
        return $this->update($user, $cashRegister);
    }
}
