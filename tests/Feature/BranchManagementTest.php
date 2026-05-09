<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_and_update_branch(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = User::factory()->forRoleSlug('owner')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($owner)->post(route('branches.store'), [
            'name' => 'Sucursal Centro',
            'branch_site_kind' => 'standalone',
            'address' => 'Av. Juárez 123, Zona Centro',
            'city' => 'Guadalajara',
            'state' => 'Jalisco',
            'postal_code' => '44100',
        ])->assertRedirect();

        $branch = Branch::query()->where('name', 'Sucursal Centro')->firstOrFail();

        $this->actingAs($owner)->patch(route('branches.update', $branch->id), [
            'name' => 'Sucursal Centro Actualizada',
            'branch_site_kind' => 'standalone',
            'address' => 'Av. Juárez 123, Zona Centro',
            'city' => 'Guadalajara',
            'state' => 'Jalisco',
            'postal_code' => '44100',
        ])->assertRedirect();

        $this->assertDatabaseHas('branches', [
            'id' => $branch->id,
            'name' => 'Sucursal Centro Actualizada',
        ]);
    }

    public function test_cajero_cannot_create_branch(): void
    {
        $tenant = Tenant::factory()->create();
        $cajero = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($cajero)->post(route('branches.store'), [
            'name' => 'Sucursal Prohibida',
        ])->assertForbidden();
    }

    public function test_owner_cannot_exceed_max_branches_for_plan(): void
    {
        $tenant = Tenant::factory()->create([
            'max_branches' => 1,
        ]);
        $owner = User::factory()->forRoleSlug('owner')->create([
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($owner)->post(route('branches.store'), [
            'name' => 'Segunda sucursal',
            'branch_site_kind' => 'standalone',
            'address' => 'Insurgentes Sur 100',
            'city' => 'CDMX',
            'state' => 'CMX',
            'postal_code' => '01000',
        ])->assertSessionHasErrors('name');
    }
}
