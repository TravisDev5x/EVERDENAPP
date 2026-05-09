<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ProductCategory::class);

        $categories = ProductCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'color', 'sort_order', 'is_active']);

        // Conteo de productos por categoría (para mostrar en la tabla)
        $productCounts = Product::query()
            ->selectRaw('category_id, COUNT(*) as total')
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        $categoriesWithCount = $categories->map(function (ProductCategory $cat) use ($productCounts): array {
            $data = $cat->toArray();
            $data['products_count'] = (int) ($productCounts[$cat->id] ?? 0);

            return $data;
        })->values()->all();

        return Inertia::render('ProductCategories/Index', [
            'categories' => $categoriesWithCount,
            'canManage' => $request->user()?->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE) ?? false,
        ]);
    }
}
