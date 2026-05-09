<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'branch_id',
        'cash_register_id',
        'user_id',
        'status',
        'opening_amount',
        'cash_sales_total',
        'expected_closing_amount',
        'closing_amount',
        'closing_difference',
        'closing_note',
        'opened_at',
        'closed_at',
        'close_idempotency_key',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<CashRegister, $this>
     */
    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<CashCountLine, $this>
     */
    public function countLines(): HasMany
    {
        return $this->hasMany(CashCountLine::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
