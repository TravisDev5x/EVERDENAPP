<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAlert extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'branch_id',
        'product_id',
        'inventory_policy_id',
        'severity',
        'status',
        'current_stock',
        'threshold',
        'dedupe_key',
        'triggered_at',
        'resolved_at',
        'metadata',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'triggered_at' => 'datetime',
        'resolved_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
