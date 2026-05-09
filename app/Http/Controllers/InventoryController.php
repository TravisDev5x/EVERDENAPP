<?php

namespace App\Http\Controllers;

use App\Models\InventoryAlert;
use App\Models\InventoryPolicy;
use App\Models\Product;
use App\Services\InventoryService;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function adjustStock(
        Request $request,
        Product $product,
        InventoryService $inventoryService
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission(Permissions::INVENTORY_MANAGE), 403);

        $validated = $request->validate([
            'new_quantity' => ['required', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $branchId = (int) app('current_branch_id');
        $newQuantity = round((float) $validated['new_quantity'], 3);

        $inventoryService->adjustStockToTarget(
            product: $product,
            branchId: $branchId,
            targetQuantity: $newQuantity,
            sourceType: Product::class,
            sourceId: $product->id,
            metadata: [
                'reason' => $validated['reason'],
            ],
        );

        return back()->with('success', 'Inventario ajustado correctamente.');
    }

    public function updatePolicy(Request $request, Product $product): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::INVENTORY_MANAGE), 403);

        $validated = $request->validate([
            'min_threshold' => ['required', 'numeric', 'min:0'],
            'is_alert_enabled' => ['required', 'boolean'],
            'cooldown_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        InventoryPolicy::query()->updateOrCreate(
            [
                'tenant_id' => $product->tenant_id,
                'branch_id' => (int) app('current_branch_id'),
                'product_id' => $product->id,
            ],
            [
                'min_threshold' => round((float) $validated['min_threshold'], 3),
                'is_alert_enabled' => (bool) $validated['is_alert_enabled'],
                'cooldown_minutes' => (int) $validated['cooldown_minutes'],
            ]
        );

        return back()->with('success', 'Politica de inventario actualizada.');
    }

    public function acknowledgeAlert(Request $request, InventoryAlert $alert): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::INVENTORY_MANAGE), 403);
        abort_unless((int) $alert->branch_id === (int) app('current_branch_id'), 403);

        if ($alert->status === 'open') {
            $alert->update([
                'status' => 'acknowledged',
            ]);
        }

        return back()->with('success', 'Alerta marcada como atendida.');
    }
}
