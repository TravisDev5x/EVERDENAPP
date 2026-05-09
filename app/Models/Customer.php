<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'branch_id',
        'created_by',
        'updated_by',
        'anonymized_by',
        'name',
        'email',
        'phone',
        'tax_id',
        'notes',
        'privacy_accepted_at',
        'privacy_version',
        'privacy_acceptance_source',
        'marketing_blocked_at',
        'anonymized_at',
        'custody_reason',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'privacy_accepted_at' => 'datetime',
        'marketing_blocked_at' => 'datetime',
        'anonymized_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function anonymizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'anonymized_by');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function privacyEvents(): HasMany
    {
        return $this->hasMany(CustomerPrivacyEvent::class);
    }

    public function hasPrivacyConsent(): bool
    {
        return $this->privacy_accepted_at !== null && $this->anonymized_at === null;
    }

    public function isInCustody(): bool
    {
        return $this->anonymized_at !== null;
    }
}
