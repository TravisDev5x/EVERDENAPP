<?php

namespace App\Domain\Cashier;

use App\Models\Branch;
use App\Models\CashRegister;

final class BranchCashRegisterBootstrap
{
    /**
     * Garantiza al menos una caja registradora activa por sucursal (idempotente).
     */
    public function ensureDefaults(Branch $branch): void
    {
        if (CashRegister::query()->where('branch_id', $branch->id)->exists()) {
            return;
        }

        CashRegister::query()->create([
            'tenant_id' => $branch->tenant_id,
            'branch_id' => $branch->id,
            'name' => 'Caja 1',
            'code' => 'caja-1',
            'is_active' => true,
            'sort_order' => 0,
        ]);
    }
}
