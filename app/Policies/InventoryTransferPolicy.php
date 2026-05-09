<?php

namespace App\Policies;

use App\Models\InventoryTransfer;
use App\Models\User;
use App\Support\Permissions;

class InventoryTransferPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::INVENTORY_VIEW);
    }

    public function view(User $user, InventoryTransfer $transfer): bool
    {
        return (int) $user->tenant_id === (int) $transfer->tenant_id
            && $user->hasPermission(Permissions::INVENTORY_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::INVENTORY_MANAGE);
    }
}
