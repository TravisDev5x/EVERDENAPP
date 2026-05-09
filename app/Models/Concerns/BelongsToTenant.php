<?php

namespace App\Models\Concerns;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::creating(function ($model): void {
            /** @var TenantContext $tenantContext */
            $tenantContext = app(TenantContext::class);

            if (! $model->tenant_id && $tenantContext->hasTenant()) {
                $model->tenant_id = $tenantContext->tenantId();
            } elseif (! $model->tenant_id && app()->bound('current_tenant_id')) {
                $model->tenant_id = app('current_tenant_id');
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder): void {
            /** @var TenantContext $tenantContext */
            $tenantContext = app(TenantContext::class);

            if ($tenantContext->hasTenant()) {
                $builder->where(
                    $builder->getModel()->getTable().'.tenant_id',
                    $tenantContext->tenantId()
                );
            } elseif (app()->bound('current_tenant_id')) {
                $builder->where(
                    $builder->getModel()->getTable().'.tenant_id',
                    app('current_tenant_id')
                );
            }
        });
    }
}
