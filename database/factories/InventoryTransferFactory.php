<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\InventoryTransfer;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryTransfer>
 */
class InventoryTransferFactory extends Factory
{
    protected $model = InventoryTransfer::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tenant = Tenant::factory();

        return [
            'tenant_id' => $tenant,
            'source_branch_id' => Branch::factory()->for($tenant),
            'destination_branch_id' => Branch::factory()->for($tenant),
            'user_id' => User::factory()->for($tenant),
            'reference' => null,
            'status' => 'completed',
            'reason' => null,
            'completed_at' => now(),
        ];
    }
}
