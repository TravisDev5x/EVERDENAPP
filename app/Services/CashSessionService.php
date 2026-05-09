<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Branch;
use App\Models\User;

class CashSessionService
{
    public function openFor(User $user, Branch $branch, CashRegister $register, float $openingAmount): CashSession
    {
        return CashSession::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'cash_register_id' => $register->id,
            'status' => 'open',
            'opening_amount' => round($openingAmount, 2),
            'cash_sales_total' => 0,
            'opened_at' => now(),
        ]);
    }

    public function currentOpenFor(User $user, ?int $branchId = null): ?CashSession
    {
        $query = CashSession::query()
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->latest('id');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->first();
    }
}
