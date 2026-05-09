<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_team_member_role(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);
        $member = User::factory()->forRoleSlug('cajero')->create(['tenant_id' => $tenant->id]);

        $supervisorId = (int) Role::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'supervisor')
            ->value('id');

        $this->assertNotSame(0, $supervisorId);

        $this->actingAs($admin)->patch(route('team.users.update', $member->id), [
            'role_id' => $supervisorId,
        ])->assertRedirect();

        $this->assertSame($supervisorId, $member->fresh()->role_id);
    }

    public function test_admin_can_sync_custom_role_permissions(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);

        $role = Role::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'ayudante-test',
            'name' => 'Ayudante',
            'description' => null,
            'is_system' => false,
        ]);

        $keys = [
            Permissions::CATALOG_PRODUCTS_VIEW,
            Permissions::REPORTS_VIEW,
        ];

        $this->actingAs($admin)->post(route('team.roles.permissions.sync', $role->id), [
            'permission_keys' => $keys,
        ])->assertRedirect();

        $synced = $role->fresh()->load('permissions')->permissions->pluck('key')->all();
        sort($keys);
        sort($synced);

        $this->assertSame($keys, $synced);
    }

    public function test_admin_can_update_custom_role_metadata(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);

        $role = Role::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'meta-test',
            'name' => 'Nombre Viejo',
            'description' => 'Antes',
            'is_system' => false,
        ]);

        $this->actingAs($admin)->patch(route('team.roles.update', $role->id), [
            'name' => 'Nombre Nuevo',
            'description' => 'Despues',
        ])->assertRedirect();

        $role->refresh();

        $this->assertSame('Nombre Nuevo', $role->name);
        $this->assertSame('Despues', $role->description);
    }

    public function test_admin_can_delete_custom_role_without_users(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);

        $role = Role::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'borrar-test',
            'name' => 'Temporal',
            'description' => null,
            'is_system' => false,
        ]);

        $this->actingAs($admin)->delete(route('team.roles.destroy', $role->id))->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_admin_cannot_delete_custom_role_with_assigned_users(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);

        $role = Role::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'con-usuario',
            'name' => 'Con usuario',
            'description' => null,
            'is_system' => false,
        ]);

        User::factory()->create([
            'tenant_id' => $tenant->id,
            'role_id' => $role->id,
        ]);

        $this->actingAs($admin)->delete(route('team.roles.destroy', $role->id))->assertRedirect();

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }
}
