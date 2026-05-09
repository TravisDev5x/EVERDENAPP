<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Support\Permissions;

class PaymentPolicy
{
    public function pay(User $user, Sale $sale): bool
    {
        return $sale->tenant_id === $user->tenant_id
            && $sale->status === 'confirmed'
            && $sale->payment_status === 'unpaid'
            && $user->hasPermission(Permissions::PAYMENTS_CASH);
    }
}
