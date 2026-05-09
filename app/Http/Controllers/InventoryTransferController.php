<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryTransferRequest;
use App\Models\InventoryTransfer;
use App\Services\AuditLogger;
use App\Services\InventoryTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InventoryTransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InventoryTransfer::class);

        $transfers = InventoryTransfer::query()
            ->with(['sourceBranch:id,name', 'destinationBranch:id,name', 'user:id,name', 'items'])
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json($transfers);
    }

    public function store(
        StoreInventoryTransferRequest $request,
        InventoryTransferService $service,
        AuditLogger $auditLogger,
    ): JsonResponse|RedirectResponse {
        $validated = $request->validated();

        $transfer = $service->execute(
            actor: $request->user(),
            sourceBranchId: (int) $validated['source_branch_id'],
            destinationBranchId: (int) $validated['destination_branch_id'],
            items: $validated['items'],
            reference: $validated['reference'] ?? null,
            reason: $validated['reason'] ?? null,
        );

        $auditLogger->log(
            event: 'inventory_transfer.completed',
            entityType: InventoryTransfer::class,
            entityId: $transfer->id,
            actor: $request->user(),
            metadata: [
                'source_branch_id' => $transfer->source_branch_id,
                'destination_branch_id' => $transfer->destination_branch_id,
                'items_count' => $transfer->items->count(),
                'reference' => $transfer->reference,
            ],
        );

        if (! $request->expectsJson()) {
            return back()->with('success', 'Transferencia completada.');
        }

        return response()->json($transfer, 201);
    }
}
