<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantInvitation extends Model
{
    use BelongsToTenant;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'email',
        'role_id',
        'invited_by',
        'token',
        'status',
        'rejection_reason',
        'accepted_at',
        'rejected_at',
        'expires_at',
        'resent_at',
        'resend_count',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
            'resent_at' => 'datetime',
            'resend_count' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function canResend(): bool
    {
        if ($this->resent_at === null) {
            return true;
        }

        return $this->resent_at->diffInMinutes(now()) >= 10;
    }

    public function whatsappShareUrl(): string
    {
        $this->loadMissing('tenant');

        $tenantName = $this->tenant?->name ?? 'tu negocio';
        $text = "Te invité a {$tenantName} en Aberden. Acepta aquí: "
            .route('invitations.accept', $this->token);

        return 'https://wa.me/?text='.urlencode($text);
    }
}
