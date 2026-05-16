<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'stripe_price_id',
        'price_mxn',
        'max_users',
        'max_products',
        'max_branches',
        'has_offline_mode',
        'has_advanced_reports',
        'has_api_access',
        'has_cfdi',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'has_offline_mode' => 'boolean',
            'has_advanced_reports' => 'boolean',
            'has_api_access' => 'boolean',
            'has_cfdi' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
