<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DailyReportByCategoryTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function report_groups_sales_by_category(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('admin')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $catA = ProductCategory::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Bebidas',
            'slug' => 'bebidas',
            'color' => '#185FA5',
        ]);
        $catB = ProductCategory::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Abarrotes',
            'slug' => 'abarrotes',
            'color' => '#3B6D11',
        ]);

        $productA = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $catA->id,
            'price' => 25,
        ]);
        $productB = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $catB->id,
            'price' => 50,
        ]);
        $productNoCategory = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => null,
            'price' => 10,
        ]);

        $now = Carbon::now()->setTime(14, 0);

        // Venta confirmada con items de cat A y producto sin categoría
        $sale1 = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'status' => 'confirmed',
            'confirmed_at' => $now,
            'subtotal' => 60,
            'tax_total' => 0,
            'total' => 60,
        ]);
        SaleItem::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale1->id,
            'product_id' => $productA->id,
            'product_name' => $productA->name,
            'product_sku' => $productA->sku,
            'quantity' => 2,
            'unit_price' => 25,
            'tax_rate' => 0,
            'line_subtotal' => 50,
            'line_tax_total' => 0,
            'line_total' => 50,
        ]);
        SaleItem::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale1->id,
            'product_id' => $productNoCategory->id,
            'product_name' => $productNoCategory->name,
            'product_sku' => $productNoCategory->sku,
            'quantity' => 1,
            'unit_price' => 10,
            'tax_rate' => 0,
            'line_subtotal' => 10,
            'line_tax_total' => 0,
            'line_total' => 10,
        ]);

        // Venta pagada (status sigue siendo confirmed en Everden)
        $sale2 = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'confirmed_at' => $now,
            'subtotal' => 100,
            'tax_total' => 0,
            'total' => 100,
        ]);
        SaleItem::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale2->id,
            'product_id' => $productB->id,
            'product_name' => $productB->name,
            'product_sku' => $productB->sku,
            'quantity' => 2,
            'unit_price' => 50,
            'tax_rate' => 0,
            'line_subtotal' => 100,
            'line_tax_total' => 0,
            'line_total' => 100,
        ]);

        // Borrador (no debe contarse en categorías)
        $draft = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'status' => 'draft',
            'subtotal' => 999,
            'tax_total' => 0,
            'total' => 999,
        ]);
        SaleItem::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $draft->id,
            'product_id' => $productA->id,
            'product_name' => $productA->name,
            'product_sku' => $productA->sku,
            'quantity' => 99,
            'unit_price' => 25,
            'tax_rate' => 0,
            'line_subtotal' => 999,
            'line_tax_total' => 0,
            'line_total' => 999,
        ]);

        $response = $this->actingAs($user)
            ->get(route('reports.daily', ['date' => $now->toDateString()]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Reports/Daily')
            ->has('salesByCategory', 3)
            ->where('summary.categories_with_sales_count', 3)
        );
    }

    #[Test]
    public function report_excludes_draft_sales_from_category_grouping(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('admin')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $cat = ProductCategory::factory()->create(['tenant_id' => $tenant->id]);
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $cat->id,
        ]);

        // Solo borrador — no debe aparecer en el reporte
        $draft = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'status' => 'draft',
            'total' => 100,
        ]);
        SaleItem::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $draft->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => 100,
            'tax_rate' => 0,
            'line_subtotal' => 100,
            'line_tax_total' => 0,
            'line_total' => 100,
        ]);

        $response = $this->actingAs($user)
            ->get(route('reports.daily'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Reports/Daily')
            ->has('salesByCategory', 0)
        );
    }

    #[Test]
    public function report_handles_no_sales_gracefully(): void
    {
        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('admin')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $response = $this->actingAs($user)
            ->get(route('reports.daily'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Reports/Daily')
            ->has('salesByCategory', 0)
            ->where('summary.categories_with_sales_count', 0)
        );
    }
}
