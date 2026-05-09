<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinanceAccount extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'type',
        'is_system',
        'is_active',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'is_system' => 'bool',
        'is_active' => 'bool',
    ];

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return HasMany<FinanceJournalLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(FinanceJournalLine::class, 'account_id');
    }
}
