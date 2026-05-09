<?php

namespace App\Domain\Billing;

use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class TenantPlanService
{
    /**
     * @throws ValidationException
     */
    public function assertCanCreateBranch(Tenant $tenant): void
    {
        $max = $tenant->max_branches;
        if ($max === null) {
            return;
        }

        $count = Branch::query()->where('tenant_id', $tenant->id)->count();
        if ($count >= $max) {
            throw ValidationException::withMessages([
                'name' => 'Has alcanzado el máximo de sucursales permitido por tu plan.',
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    public function assertCanCreateUser(Tenant $tenant): void
    {
        $max = $tenant->max_users;
        if ($max === null) {
            return;
        }

        $count = User::query()->where('tenant_id', $tenant->id)->count();
        if ($count >= $max) {
            throw ValidationException::withMessages([
                'email' => 'Has alcanzado el máximo de usuarios permitido por tu plan.',
            ]);
        }
    }
}
