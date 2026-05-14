<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\InventoryTransfer;
use App\Models\Product;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryTransferPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InventoryTransfer::class);

        $transfers = InventoryTransfer::query()
            ->with([
                'sourceBranch:id,name',
                'destinationBranch:id,name',
                'user:id,name',
                'items.product:id,sku,name',
            ])
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (InventoryTransfer $t): array => [
                'id' => $t->id,
                'reference' => $t->reference,
                'status' => $t->status,
                'reason' => $t->reason,
                'completed_at' => $t->completed_at?->toIso8601String(),
                'created_at' => $t->created_at?->toIso8601String(),
                'source_branch' => $t->sourceBranch ? [
                    'id' => $t->sourceBranch->id,
                    'name' => $t->sourceBranch->name,
                ] : null,
                'destination_branch' => $t->destinationBranch ? [
                    'id' => $t->destinationBranch->id,
                    'name' => $t->destinationBranch->name,
                ] : null,
                'user' => $t->user ? [
                    'id' => $t->user->id,
                    'name' => $t->user->name,
                ] : null,
                'items' => $t->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'product_sku' => $item->product?->sku,
                    'quantity' => $item->quantity,
                ])->values()->all(),
            ])
            ->values();

        $branches = Branch::query()
            ->where('is_active', true)
            ->orderByDesc('is_main')
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'is_main']);

        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'sku', 'name']);

        $canManage = $request->user()?->hasPermission(Permissions::INVENTORY_MANAGE) ?? false;

        return Inertia::render('Inventory/Transfers', [
            'transfers' => $transfers,
            'branches' => $branches,
            'products' => $products,
            'canManage' => $canManage,
            'activeBranchId' => (int) app('current_branch_id'),
        ]);
    }
}
