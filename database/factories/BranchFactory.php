<?php

namespace Database\Factories;

use App\Enums\BranchSiteKind;
use App\Models\Branch;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'branch_site_kind' => BranchSiteKind::Standalone,
            'parent_branch_id' => null,
            'site_location_detail' => null,
            'name' => 'Sucursal '.fake()->city(),
            'state' => fake()->stateAbbr(),
            'city' => fake()->city(),
            'postal_code' => sprintf('%05d', fake()->numberBetween(1, 99999)),
            'address' => fake()->streetAddress(),
            'neighborhood' => fake()->optional()->streetName(),
            'municipality' => fake()->optional()->city(),
            'address_references' => null,
            'phone' => fake()->phoneNumber(),
            'rfc' => null,
            'is_main' => false,
            'is_active' => true,
        ];
    }
}
