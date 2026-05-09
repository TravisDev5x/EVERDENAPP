<?php

namespace App\Services;

use App\Jobs\ProcessSalePrintJob;
use App\Models\PrintJob;
use App\Models\Sale;
use App\Models\User;

/**
 * Encola un ticket para ProcessSalePrintJob (outbox JSON + agente HTTP opcional).
 */
class SalePrintEnqueueService
{
    public function enqueue(Sale $sale, User $user): PrintJob
    {
        $job = PrintJob::query()->create([
            'tenant_id' => $sale->tenant_id,
            'sale_id' => $sale->id,
            'requested_by_user_id' => $user->id,
            'status' => PrintJob::STATUS_PENDING,
        ]);

        ProcessSalePrintJob::dispatch($job->id);

        return $job;
    }
}
