<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'name' => 'Básico',
                'slug' => 'standard',
                'stripe_price_id' => null,
                'price_mxn' => 299,
                'max_users' => 3,
                'max_products' => 100,
                'max_branches' => 1,
                'has_offline_mode' => false,
                'has_advanced_reports' => false,
                'has_api_access' => false,
                'has_cfdi' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'stripe_price_id' => null,
                'price_mxn' => 599,
                'max_users' => 10,
                'max_products' => -1,
                'max_branches' => 3,
                'has_offline_mode' => true,
                'has_advanced_reports' => true,
                'has_api_access' => false,
                'has_cfdi' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'stripe_price_id' => null,
                'price_mxn' => 1199,
                'max_users' => -1,
                'max_products' => -1,
                'max_branches' => -1,
                'has_offline_mode' => true,
                'has_advanced_reports' => true,
                'has_api_access' => true,
                'has_cfdi' => false,
                'is_active' => true,
            ],
        ];

        foreach ($rows as $row) {
            Plan::query()->updateOrCreate(
                ['slug' => $row['slug']],
                $row
            );
        }
    }
}
