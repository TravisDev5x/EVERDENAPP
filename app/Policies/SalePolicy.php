<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Support\Permissions;

class SalePolicy
{
    public function view(User $user, Sale $sale): bool
    {
        return $user->tenant_id === $sale->tenant_id
            && $user->hasPermission(Permissions::SALES_OPERATE);
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::SALES_OPERATE);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::SALES_OPERATE);
    }

    public function update(User $user, Sale $sale): bool
    {
        return $user->tenant_id === $sale->tenant_id
            && $sale->isDraft()
            && $user->hasPermission(Permissions::SALES_OPERATE);
    }

    public function confirm(User $user, Sale $sale): bool
    {
        return $user->tenant_id === $sale->tenant_id
            && $sale->isDraft()
            && $user->hasPermission(Permissions::SALES_OPERATE);
    }
}
