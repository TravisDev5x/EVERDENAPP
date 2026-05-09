<?php

namespace App\Models;

use App\Enums\BranchSiteKind;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'branch_site_kind',
        'parent_branch_id',
        'code',
        'state',
        'city',
        'postal_code',
        'address',
        'neighborhood',
        'municipality',
        'address_references',
        'site_location_detail',
        'phone',
        'rfc',
        'is_main',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'branch_site_kind' => BranchSiteKind::class,
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Punto “ancla” (p. ej. tienda en plaza, sucursal matriz del mismo sitio). Solo un nivel de jerarquía.
     *
     * @return BelongsTo<Branch, $this>
     */
    public function parentBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'parent_branch_id');
    }

    /**
     * @return HasMany<Branch, $this>
     */
    public function childBranches(): HasMany
    {
        return $this->hasMany(Branch::class, 'parent_branch_id');
    }

    /**
     * @return HasMany<CashRegister, $this>
     */
    public function cashRegisters(): HasMany
    {
        return $this->hasMany(CashRegister::class);
    }
}
