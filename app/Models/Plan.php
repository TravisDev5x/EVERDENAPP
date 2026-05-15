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
        'price_mxn',
        'max_users',
        'max_products',
        'max_branches',
        'has_offline_mode',
        'has_advanced_reports',
        'has_api_access',
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
            'is_active' => 'boolean',
        ];
    }
}
