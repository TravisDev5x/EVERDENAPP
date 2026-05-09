<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformTenantDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_operator_can_open_tenant_directory(): void
    {
        $platform = User::factory()->platformOperator()->create();

        $this->actingAs($platform)->get(route('platform.tenants.index'))->assertOk();
    }

    public function test_tenant_user_cannot_access_platform_directory(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forRoleSlug('admin')->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user)->get(route('platform.tenants.index'))->assertForbidden();
    }

    public function test_suspended_tenant_user_is_redirected_from_dashboard_to_suspended_screen(): void
    {
        $tenant = Tenant::factory()->create(['is_active' => true]);
        $member = User::factory()->forRoleSlug('cajero')->create(['tenant_id' => $tenant->id]);

        $platform = User::factory()->platformOperator()->create();

        $this->actingAs($platform)->patch(route('platform.tenants.suspend', $tenant->id), [
            'reason' => 'Prueba de cobro',
        ])->assertRedirect();

        $this->actingAs($member)->get(route('dashboard'))->assertRedirect(route('account.suspended'));

        $this->actingAs($member)->get(route('account.suspended'))->assertOk();
    }

    public function test_platform_can_update_tenant_plan_and_limits(): void
    {
        $tenant = Tenant::factory()->create([
            'plan_slug' => 'standard',
            'max_users' => null,
            'max_branches' => null,
        ]);
        $platform = User::factory()->platformOperator()->create();

        $this->actingAs($platform)->patch(route('platform.tenants.plan.update', $tenant->id), [
            'plan_slug' => 'pro',
            'max_users' => 10,
            'max_branches' => 3,
        ])->assertRedirect();

        $tenant->refresh();

        $this->assertSame('pro', $tenant->plan_slug);
        $this->assertSame(10, $tenant->max_users);
        $this->assertSame(3, $tenant->max_branches);
    }

    public function test_platform_can_update_tenant_name_and_trade_name(): void
    {
        $tenant = Tenant::factory()->create([
            'name' => 'Razón social SA',
            'trade_name' => null,
        ]);
        $platform = User::factory()->platformOperator()->create();

        $this->actingAs($platform)->patch(route('platform.tenants.update', $tenant->id), [
            'name' => 'Razón social SA de CV',
            'trade_name' => 'Mi Tienda Demo',
        ])->assertRedirect();

        $tenant->refresh();

        $this->assertSame('Razón social SA de CV', $tenant->name);
        $this->assertSame('Mi Tienda Demo', $tenant->trade_name);
    }

    public function test_platform_can_suspend_and_reactivate_tenant(): void
    {
        $tenant = Tenant::factory()->create(['is_active' => true]);
        $platform = User::factory()->platformOperator()->create();

        $this->actingAs($platform)->patch(route('platform.tenants.suspend', $tenant->id), [
            'reason' => 'Moroso',
        ])->assertRedirect();

        $tenant->refresh();
        $this->assertFalse($tenant->is_active);
        $this->assertNotNull($tenant->suspended_at);

        $this->actingAs($platform)->patch(route('platform.tenants.activate', $tenant->id))->assertRedirect();

        $tenant->refresh();
        $this->assertTrue($tenant->is_active);
        $this->assertNull($tenant->suspended_at);
        $this->assertNull($tenant->suspension_reason);
    }
}
