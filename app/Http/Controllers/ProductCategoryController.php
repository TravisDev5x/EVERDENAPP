<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductCategoryRequest;
use App\Http\Requests\UpdateProductCategoryRequest;
use App\Models\ProductCategory;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProductCategory::class);

        $categories = ProductCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(
        StoreProductCategoryRequest $request,
        AuditLogger $auditLogger
    ): JsonResponse|RedirectResponse {
        $validated = $request->validated();

        $category = ProductCategory::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $auditLogger->log(
            event: 'product_category.created',
            entityType: ProductCategory::class,
            entityId: $category->id,
            actor: $request->user(),
            metadata: [
                'name' => $category->name,
                'slug' => $category->slug,
            ]
        );

        if (! $request->expectsJson()) {
            return back()->with('success', 'Categoría creada.');
        }

        return response()->json($category, 201);
    }

    public function update(
        UpdateProductCategoryRequest $request,
        ProductCategory $product_category,
        AuditLogger $auditLogger
    ): JsonResponse|RedirectResponse {
        $validated = $request->validated();

        $before = $product_category->only([
            'name', 'slug', 'description', 'color', 'sort_order', 'is_active',
        ]);

        $product_category->update($validated);

        $auditLogger->log(
            event: 'product_category.updated',
            entityType: ProductCategory::class,
            entityId: $product_category->id,
            actor: $request->user(),
            metadata: [
                'before' => $before,
                'after' => $product_category->fresh()->only([
                    'name', 'slug', 'description', 'color', 'sort_order', 'is_active',
                ]),
            ]
        );

        if (! $request->expectsJson()) {
            return back()->with('success', 'Categoría actualizada.');
        }

        return response()->json($product_category->fresh());
    }

    public function destroy(
        Request $request,
        ProductCategory $product_category,
        AuditLogger $auditLogger
    ): JsonResponse|RedirectResponse {
        $this->authorize('delete', $product_category);

        $snapshot = $product_category->only([
            'id', 'name', 'slug', 'tenant_id',
        ]);

        $product_category->delete();

        $auditLogger->log(
            event: 'product_category.deleted',
            entityType: ProductCategory::class,
            entityId: $snapshot['id'],
            actor: $request->user(),
            metadata: $snapshot
        );

        if (! $request->expectsJson()) {
            return back()->with('success', 'Categoría eliminada.');
        }

        return response()->json(['deleted' => true]);
    }
}
