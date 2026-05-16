<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use LogicException;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::creating(function (Model $model): void {
            if ($model->tenant_id !== null && $model->tenant_id !== '') {
                return;
            }

            $tenantId = self::resolveTenantId();

            if ($tenantId === null) {
                if (! app()->runningInConsole()) {
                    throw new LogicException(
                        sprintf('Cannot create [%s] without a resolved tenant_id.', static::class)
                    );
                }

                return;
            }

            $model->tenant_id = $tenantId;
        });

        static::addGlobalScope('tenant', function (Builder $builder): void {
            $tenantId = self::resolveTenantId();

            if ($tenantId === null) {
                if (! app()->runningInConsole()) {
                    $builder->whereRaw('1 = 0');
                }
                return;
            }

            $builder->where(
                $builder->getModel()->getTable().'.tenant_id',
                $tenantId
            );
        });
    }

    private static function resolveTenantId(): int|string|null
    {
        /** @var TenantContext $ctx */
        $ctx = app(TenantContext::class);

        if ($ctx->hasTenant()) {
            return $ctx->tenantId();
        }

        if (app()->bound('current_tenant_id')) {
            return app('current_tenant_id');
        }

        return null;
    }

    public function belongsToCurrentTenant(): bool
    {
        $tenantId = self::resolveTenantId();

        if ($tenantId === null) {
            return false;
        }

        return (int) $this->tenant_id === (int) $tenantId;
    }

    public function assertBelongsToCurrentTenant(): void
    {
        if (! $this->belongsToCurrentTenant()) {
            abort(403, 'Resource does not belong to the current tenant.');
        }
    }
}
