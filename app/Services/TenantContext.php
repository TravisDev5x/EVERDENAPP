<?php

namespace App\Services;

class TenantContext
{
    private ?int $tenantId = null;

    private ?int $branchId = null;

    public function set(int $tenantId, int $branchId): void
    {
        $this->tenantId = $tenantId;
        $this->branchId = $branchId;
    }

    public function tenantId(): ?int
    {
        return $this->tenantId;
    }

    public function branchId(): ?int
    {
        return $this->branchId;
    }

    public function hasTenant(): bool
    {
        return $this->tenantId !== null;
    }

    public function hasBranch(): bool
    {
        return $this->branchId !== null;
    }

    /**
     * Libera el contexto (p. ej. tras seeds o jobs que simulan HTTP).
     */
    public function clear(): void
    {
        $this->tenantId = null;
        $this->branchId = null;
    }
}
