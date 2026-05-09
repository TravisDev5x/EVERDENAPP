<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformOperatorSeeder extends Seeder
{
    /**
     * Operador de plataforma (super admin): sin tenant; solo consola /platform.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'platform@demo.local'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'tenant_id' => null,
                'branch_id' => null,
                'role_id' => null,
                'is_platform_operator' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
