<?php

namespace App\Http\Controllers;

use App\Models\BranchProductStock;
use App\Models\InventoryAlert;
use App\Models\InventoryMovement;
use App\Models\InventoryPolicy;
use App\Models\Product;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryPageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasAnyPermission([
                Permissions::INVENTORY_VIEW,
                Permissions::INVENTORY_MANAGE,
            ]),
            403
        );

        $branchId = (int) app('current_branch_id');
        $search = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', 'all');

        $products = Product::query()
            ->where('is_active', true)
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'unit']);

        $productIds = $products->pluck('id');

        $stockMap = BranchProductStock::query()
            ->where('branch_id', $branchId)
            ->whereIn('product_id', $productIds)
            ->pluck('quantity', 'product_id');

        $policies = InventoryPolicy::query()
            ->where('branch_id', $branchId)
            ->whereIn('product_id', $productIds)
            ->get(['id', 'product_id', 'min_threshold', 'is_alert_enabled', 'cooldown_minutes'])
            ->keyBy('product_id');

        $alerts = InventoryAlert::query()
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->whereIn('product_id', $productIds)
            ->orderByDesc('id')
            ->get([
                'id',
                'product_id',
                'severity',
                'status',
                'current_stock',
                'threshold',
                'triggered_at',
            ]);

        $productRows = $products->map(function (Product $product) use ($policies, $stockMap): array {
            $policy = $policies->get($product->id);
            $threshold = (float) ($policy?->min_threshold ?? 10);
            $stock = (float) ($stockMap[$product->id] ?? 0);
            $stockStatus = $stock <= 0
                ? 'critical'
                : ($stock <= $threshold ? 'low' : 'ok');

            return [
                ...$product->toArray(),
                'quantity_on_hand' => $stock,
                'policy' => $policy ? $policy->toArray() : null,
                'stock_status' => $stockStatus,
            ];
        });

        if ($status !== 'all') {
            $productRows = $productRows->filter(
                fn (array $row): bool => $row['stock_status'] === $status
            )->values();
        }

        $movementPaginator = InventoryMovement::query()
            ->where('branch_id', $branchId)
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Index', [
            'products' => $productRows,
            'alerts' => $alerts,
            'movements' => [
                'data' => $movementPaginator->items(),
                'current_page' => $movementPaginator->currentPage(),
                'last_page' => $movementPaginator->lastPage(),
                'total' => $movementPaginator->total(),
            ],
            'filters' => [
                'q' => $search,
                'status' => $status,
            ],
            'activeBranchId' => $branchId,
            'canManage' => $request->user()?->hasPermission(Permissions::INVENTORY_MANAGE) ?? false,
        ]);
    }
}
