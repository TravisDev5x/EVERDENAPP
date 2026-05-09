<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use BelongsToTenant;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'slug',
        'name',
        'description',
        'is_system',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * @return BelongsToMany<Permission, $this>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }

    public function hasPermission(string $key): bool
    {
        return $this->permissions()->where('key', $key)->exists();
    }
}
