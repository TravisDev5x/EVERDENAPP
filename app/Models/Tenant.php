<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Cashier\Billable;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use Billable;

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
        'allow_google_self_registration',
        'suspended_at',
        'suspension_reason',
        'plan_slug',
        'max_users',
        'max_branches',
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'trial_ends_at',
        'plan_id',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enterprise_enabled' => 'boolean',
            'is_active' => 'boolean',
            'allow_google_self_registration' => 'boolean',
            'suspended_at' => 'datetime',
            'trial_ends_at' => 'datetime',
        ];
    }

    public function canOperate(): bool
    {
        return in_array($this->status, ['trial', 'active'], true);
    }

    public function trialDaysRemaining(): int
    {
        if (! $this->trial_ends_at || $this->status !== 'trial') {
            return 0;
        }

        return max(0, (int) now()->diffInDays($this->trial_ends_at, false));
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
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

    public function stripeEmail(): ?string
    {
        return $this->users()->orderBy('id')->value('email');
    }
}
