<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'business_name' => 'Abarrotes La Esquina',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'privacy_notice_accepted' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $this->assertSame('owner', $user->fresh()->tenantRole?->slug);

        $tenant = Tenant::query()->where('name', 'Abarrotes La Esquina')->firstOrFail();
        $this->assertSame('MX', $tenant->country_code);
        $this->assertSame('MXN', $tenant->currency_code);
        $this->assertSame('America/Mexico_City', $tenant->timezone);
        $this->assertSame($tenant->id, $user->tenant_id);

        $this->assertDatabaseHas('branches', [
            'tenant_id' => $tenant->id,
            'name' => 'Sucursal Matriz',
            'is_main' => true,
        ]);
        $this->assertNotNull($user->branch_id);
    }
}
