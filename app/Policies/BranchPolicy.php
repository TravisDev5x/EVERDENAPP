<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;
use App\Support\Permissions;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::BRANCHES_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::BRANCHES_MANAGE);
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->tenant_id === $branch->tenant_id
            && $user->hasPermission(Permissions::BRANCHES_MANAGE);
    }
}
