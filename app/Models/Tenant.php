<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'trade_name',
        'slug',
        'country_code',
        'currency_code',
        'timezone',
        'tenancy_mode',
        'db_connection',
        'db_database',
        'db_host',
        'db_port',
        'enterprise_enabled',
        'is_active',
        'suspended_at',
        'suspension_reason',
        'plan_slug',
        'max_users',
        'max_branches',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enterprise_enabled' => 'boolean',
            'is_active' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Branch, $this>
     */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }
}
