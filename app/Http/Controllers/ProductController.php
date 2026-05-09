<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\AuditLogger;
use App\Services\BranchStockBootstrap;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()
            ->orderBy('name')
            ->get();

        return response()->json($products);
    }

    public function store(
        StoreProductRequest $request,
        AuditLogger $auditLogger,
        BranchStockBootstrap $branchStockBootstrap,
        InventoryService $inventoryService
    ): JsonResponse|RedirectResponse {
        $validated = $request->validated();

        $product = DB::transaction(function () use ($validated, $branchStockBootstrap, $inventoryService, $request): Product {
            $product = Product::create([
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'name' => $validated['name'],
                'price' => $validated['price'],
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'unit' => $validated['unit'] ?? 'pieza',
                'is_active' => $validated['is_active'] ?? true,
                'category_id' => $validated['category_id'] ?? null,
            ]);

            $branchStockBootstrap->ensureStocksForProduct($product);

            $initial = round((float) ($validated['initial_branch_quantity'] ?? 0), 3);
            if ($initial > 0) {
                $inventoryService->applyStockDelta(
                    product: $product->fresh(),
                    branchId: (int) app('current_branch_id'),
                    type: 'ADJUSTMENT',
                    quantityDelta: $initial,
                    sourceType: Product::class,
                    sourceId: $product->id,
                    metadata: [
                        'reason' => 'Stock inicial al crear producto (sucursal activa)',
                    ],
                );
            }

            return $product;
        });

        $auditLogger->log(
            event: 'product.created',
            entityType: Product::class,
            entityId: $product->id,
            actor: $request->user(),
            metadata: [
                'sku' => $product->sku,
                'name' => $product->name,
            ]
        );

        if (! $request->expectsJson()) {
            return to_route('products.page');
        }

        return response()->json($product, 201);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        AuditLogger $auditLogger
    ): JsonResponse|RedirectResponse {
        $validated = $request->validated();
        $before = $product->only(['name', 'price', 'tax_rate', 'unit', 'is_active', 'category_id', 'barcode']);

        $product->update($validated);

        $auditLogger->log(
            event: 'product.updated',
            entityType: Product::class,
            entityId: $product->id,
            actor: $request->user(),
            metadata: [
                'before' => $before,
                'after' => $product->fresh()->only(['name', 'price', 'tax_rate', 'unit', 'is_active', 'category_id', 'barcode']),
            ]
        );

        if (! $request->expectsJson()) {
            return to_route('products.page');
        }

        return response()->json($product->fresh());
    }
}
