<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceJournalLine extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'journal_entry_id',
        'account_id',
        'debit_cents',
        'credit_cents',
        'memo',
    ];

    /**
     * @return BelongsTo<FinanceJournalEntry, $this>
     */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(FinanceJournalEntry::class, 'journal_entry_id');
    }

    /**
     * @return BelongsTo<FinanceAccount, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'account_id');
    }
}
