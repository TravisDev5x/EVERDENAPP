<?php

namespace App\Http\Controllers;

use App\Models\BranchProductStock;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $branchId = (int) app('current_branch_id');

        $categories = ProductCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color']);

        $paginator = Product::query()
            ->with('category:id,name,slug,color')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $stockMap = BranchProductStock::query()
            ->where('branch_id', $branchId)
            ->whereIn('product_id', $paginator->getCollection()->pluck('id'))
            ->pluck('quantity', 'product_id');

        $paginator->setCollection(
            $paginator->getCollection()->map(function (Product $product) use ($stockMap): array {
                $data = $product->toArray();
                $data['quantity_at_branch'] = (float) ($stockMap[$product->id] ?? 0);

                return $data;
            }),
        );

        return Inertia::render('Products/Index', [
            'products' => $paginator,
            'canManage' => $request->user()?->hasPermission(\App\Support\Permissions::CATALOG_PRODUCTS_MANAGE) ?? false,
            'categories' => $categories,
        ]);
    }
}
