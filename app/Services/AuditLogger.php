<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Contracts\Auth\Authenticatable;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function log(
        string $event,
        string $entityType,
        ?int $entityId,
        ?Authenticatable $actor,
        array $metadata = []
    ): AuditLog {
        $branchId = null;
        if (app()->bound('current_branch_id')) {
            $branchId = app('current_branch_id');
        } elseif ($actor) {
            $branchId = data_get($actor, 'branch_id');
        }

        return AuditLog::create([
            'branch_id' => $branchId,
            'user_id' => $actor?->getAuthIdentifier(),
            'event' => $event,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $metadata,
        ]);
    }
}
