<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class BelongsToCurrentTenant implements ValidationRule
{
    public function __construct(
        private readonly string $table,
        private readonly string $column = 'id',
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $tenantId = $this->resolveTenantId();

        if ($tenantId === null) {
            $fail("No se pudo resolver el contexto del tenant para validar :attribute.");
            return;
        }

        $exists = DB::table($this->table)
            ->where($this->column, $value)
            ->where('tenant_id', $tenantId)
            ->exists();

        if (! $exists) {
            $fail("El :attribute seleccionado no es válido.");
        }
    }

    private function resolveTenantId(): int|string|null
    {
        $ctx = app(\App\Services\TenantContext::class);

        if ($ctx->hasTenant()) {
            return $ctx->tenantId();
        }

        if (app()->bound('current_tenant_id')) {
            return app('current_tenant_id');
        }

        return null;
    }
}
