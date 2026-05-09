<?php

namespace Database\Seeders;

use App\Domain\Cashier\BranchCashRegisterBootstrap;
use App\Models\Branch;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SaleCalculator;
use App\Services\StressSaleFlowService;
use App\Services\TenantRoleBootstrap;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Datos sintéticos voluminosos para pruebas de rendimiento y UI (no para producción real).
 *
 * Requisitos: migraciones aplicadas y catálogo RBAC ({@see RolesSeeder}).
 *
 * Modos:
 * - Por defecto: inserta ventas/pagos como registros (rápido; inventario y finanzas no siguen el flujo vivo).
 * - STRESS_USE_REAL_FLOW=true: cada venta pasa por borrador → líneas → confirmación ({@see InventoryService}) →
 *   cobro en caja ({@see FinanceService}); más lento pero útil para detectar bugs de integridad.
 *
 * Uso típico:
 *   php artisan db:seed --class=StressDataSeeder
 *
 * Variables .env (opcionales): STRESS_USE_REAL_FLOW, STRESS_TENANTS, STRESS_BRANCHES_PER_TENANT,
 * STRESS_PRODUCTS_PER_TENANT, STRESS_SALES_PER_BRANCH, STRESS_AUDIT_ROWS_PER_TENANT,
 * STRESS_REAL_FLOW_OPENING_AMOUNT, STRESS_SEED_ENABLED (obligatorio en production).
 */
class StressDataSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production') && ! filter_var(env('STRESS_SEED_ENABLED', false), FILTER_VALIDATE_BOOL)) {
            $this->command?->error(
                'StressDataSeeder rechazado en producción. Define STRESS_SEED_ENABLED=true si es intencional.'
            );

            return;
        }

        $sizes = $this->sizes();
        $useReal = $sizes['use_real_flow'];

        $this->command?->info($useReal
            ? sprintf(
                'Stress seed [FLUJO REAL]: %d tenants × %d sucursales × %d productos × %d ventas/sucursal…',
                $sizes['tenants'],
                $sizes['branches_per_tenant'],
                $sizes['products_per_tenant'],
                $sizes['sales_per_branch']
            )
            : sprintf(
                'Stress seed [directo]: %d tenants × %d sucursales × %d productos × %d ventas/sucursal…',
                $sizes['tenants'],
                $sizes['branches_per_tenant'],
                $sizes['products_per_tenant'],
                $sizes['sales_per_branch']
            ));

        /** @var TenantRoleBootstrap $bootstrap */
        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();

        $saleCalculator = app(SaleCalculator::class);
        $cashBootstrap = app(BranchCashRegisterBootstrap::class);
        $flow = $useReal ? app(StressSaleFlowService::class) : null;

        for ($t = 0; $t < $sizes['tenants']; $t++) {
            if ($useReal) {
                $this->seedOneTenantRealFlow($bootstrap, $cashBootstrap, $flow, $sizes, $t);
            } else {
                DB::transaction(function () use ($bootstrap, $saleCalculator, $cashBootstrap, $sizes, $t): void {
                    $this->seedOneTenantRaw($bootstrap, $saleCalculator, $cashBootstrap, $sizes, $t);
                });
            }
        }

        $this->command?->info('Stress seed completado.');
    }

    /**
     * @param  array<string, mixed>  $sizes
     */
    private function seedOneTenantRaw(
        TenantRoleBootstrap $bootstrap,
        SaleCalculator $saleCalculator,
        BranchCashRegisterBootstrap $cashBootstrap,
        array $sizes,
        int $t,
    ): void {
        [
            'tenant' => $tenant,
            'branches' => $branches,
            'admin' => $admin,
            'products' => $products,
        ] = $this->createTenantBase($bootstrap, $cashBootstrap, $sizes, $t);

        $productIds = collect($products)->pluck('id')->all();
        $branchIds = collect($branches)->pluck('id')->all();

        $stockRows = [];
        $now = now()->toDateTimeString();
        foreach ($branchIds as $branchId) {
            foreach ($productIds as $productId) {
                $stockRows[] = [
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branchId,
                    'product_id' => $productId,
                    'quantity' => round(fake()->randomFloat(3, 0, 800), 3),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        foreach (array_chunk($stockRows, 500) as $chunk) {
            DB::table('branch_product_stock')->insert($chunk);
        }

        foreach ($branches as $branch) {
                for ($s = 0; $s < $sizes['sales_per_branch']; $s++) {
                    // Mayoría en "hoy" para que el reporte diario por defecto muestre volumen en UX.
                    $confirmedAt = fake()->boolean(65)
                        ? Carbon::today()->setTimeFromTimeString(fake()->time('H:i:s'))
                        : Carbon::instance(fake()->dateTimeBetween('-120 days', 'now'));

                $sale = Sale::query()->create([
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branch->id,
                    'user_id' => $admin->id,
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'subtotal' => 0,
                    'tax_total' => 0,
                    'total' => 0,
                    'confirmed_at' => $confirmedAt,
                    'paid_at' => $confirmedAt,
                    'confirm_idempotency_key' => 'stress-'.Str::uuid()->toString(),
                ]);

                $numLines = fake()->numberBetween(1, 6);
                for ($li = 0; $li < $numLines; $li++) {
                    /** @var Product $product */
                    $product = $products[array_rand($products)];
                    $qty = fake()->randomFloat(3, 1, 12);

                    $line = $this->buildSaleLine($tenant->id, $product, $qty);

                    SaleItem::query()->create(array_merge($line, [
                        'sale_id' => $sale->id,
                    ]));
                }

                $saleCalculator->recalculate($sale->fresh(['items']));

                // Alinear timestamps con el día operativo del reporte (confirmed_at / paid_at).
                $sale->refresh();
                $sale->forceFill([
                    'created_at' => $confirmedAt,
                    'updated_at' => $confirmedAt,
                ])->saveQuietly();

                $payment = Payment::query()->create([
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branch->id,
                    'sale_id' => $sale->id,
                    'cash_session_id' => null,
                    'user_id' => $admin->id,
                    'method' => fake()->randomElement(['cash', 'cash', 'cash']),
                    'idempotency_key' => 'stress-pay-'.$sale->id,
                    'amount' => $sale->fresh()->total,
                    'status' => 'applied',
                    'paid_at' => $confirmedAt,
                ]);
                $payment->forceFill([
                    'created_at' => $confirmedAt,
                    'updated_at' => $confirmedAt,
                ])->saveQuietly();
            }
        }

        $this->seedAuditNoise($tenant->id, $branchIds, $admin->id, $sizes['audit_rows_per_tenant']);
    }

    /**
     * @param  array<string, mixed>  $sizes
     */
    private function seedOneTenantRealFlow(
        TenantRoleBootstrap $bootstrap,
        BranchCashRegisterBootstrap $cashBootstrap,
        StressSaleFlowService $flow,
        array $sizes,
        int $t,
    ): void {
        [
            'tenant' => $tenant,
            'branches' => $branches,
            'admin' => $admin,
            'products' => $products,
        ] = $this->createTenantBase($bootstrap, $cashBootstrap, $sizes, $t);

        $branchIds = collect($branches)->pluck('id')->all();

        $stockRows = [];
        $now = now()->toDateTimeString();
        foreach ($branchIds as $branchId) {
            foreach ($products as $product) {
                $stockRows[] = [
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                    'quantity' => 999_999.999,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        foreach (array_chunk($stockRows, 500) as $chunk) {
            DB::table('branch_product_stock')->insert($chunk);
        }

        $opening = max(0.0, (float) env('STRESS_REAL_FLOW_OPENING_AMOUNT', 500));

        foreach ($branches as $branch) {
            for ($s = 0; $s < $sizes['sales_per_branch']; $s++) {
                $at = Carbon::instance(fake()->dateTimeBetween('-120 days', 'now'));
                $flow->runCompleteSale(
                    $admin,
                    $tenant,
                    $branch,
                    $products,
                    1,
                    6,
                    $at,
                    $opening
                );
            }
        }

        $this->seedAuditNoise($tenant->id, $branchIds, $admin->id, $sizes['audit_rows_per_tenant']);
    }

    /**
     * @param  array<string, mixed>  $sizes
     * @return array{tenant: Tenant, branches: array<int, Branch>, admin: User, products: array<int, Product>}
     */
    private function createTenantBase(
        TenantRoleBootstrap $bootstrap,
        BranchCashRegisterBootstrap $cashBootstrap,
        array $sizes,
        int $t,
    ): array {
        $tenant = Tenant::query()->create([
            'name' => 'Stress Org '.Str::upper(Str::random(6)).' '.$t,
            'slug' => 'stress-'.Str::lower(Str::random(10)),
            'is_active' => true,
            'plan_slug' => 'enterprise',
            'max_users' => 500,
            'max_branches' => 100,
        ]);

        $bootstrap->ensureSystemRolesForTenant($tenant);

        $branches = [];
        $main = Branch::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Matriz '.$tenant->slug,
            'code' => 'MAT',
            'state' => 'CMX',
            'city' => 'Ciudad de México',
            'postal_code' => '01000',
            'address' => fake()->streetAddress(),
            'phone' => fake()->phoneNumber(),
            'is_main' => true,
            'is_active' => true,
        ]);
        $cashBootstrap->ensureDefaults($main);
        $branches[] = $main;

        for ($b = 1; $b < $sizes['branches_per_tenant']; $b++) {
            $branch = Branch::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Sucursal '.$b.' — '.fake()->city(),
                'code' => sprintf('S%02d', $b),
                'state' => fake()->stateAbbr(),
                'city' => fake()->city(),
                'postal_code' => fake()->postcode(),
                'address' => fake()->streetAddress(),
                'phone' => fake()->phoneNumber(),
                'is_main' => false,
                'is_active' => true,
            ]);
            $cashBootstrap->ensureDefaults($branch);
            $branches[] = $branch;
        }

        $admin = User::factory()
            ->for($tenant)
            ->forRoleSlug('admin')
            ->create([
                'name' => 'Admin Stress '.$tenant->id,
                'email' => 'stress-admin-'.$tenant->id.'@fake.local',
                'branch_id' => $main->id,
            ]);

        $products = [];
        for ($p = 0; $p < $sizes['products_per_tenant']; $p++) {
            $products[] = Product::factory()->for($tenant)->create([
                'sku' => sprintf('ST-%d-%05d', $tenant->id, $p),
                'name' => fake()->words(3, true),
                'price' => fake()->randomFloat(2, 5, 899),
                'tax_rate' => fake()->randomElement([0, 8, 16]),
                'unit' => fake()->randomElement(['pieza', 'caja', 'kg']),
            ]);
        }

        return [
            'tenant' => $tenant,
            'branches' => $branches,
            'admin' => $admin,
            'products' => $products,
        ];
    }

    /**
     * @return array{
     *     use_real_flow: bool,
     *     tenants: int,
     *     branches_per_tenant: int,
     *     products_per_tenant: int,
     *     sales_per_branch: int,
     *     audit_rows_per_tenant: int
     * }
     */
    private function sizes(): array
    {
        $useReal = filter_var(env('STRESS_USE_REAL_FLOW', false), FILTER_VALIDATE_BOOL);

        $tenants = max(1, min(50, (int) env('STRESS_TENANTS', $useReal ? 2 : 3)));
        $branches = max(1, min(25, (int) env('STRESS_BRANCHES_PER_TENANT', $useReal ? 3 : 4)));
        $products = max(10, min(5000, (int) env('STRESS_PRODUCTS_PER_TENANT', $useReal ? 40 : 120)));

        $maxSales = $useReal ? 500 : 5000;
        $defaultSales = $useReal ? 25 : 200;
        $salesPerBranch = max(1, min($maxSales, (int) env('STRESS_SALES_PER_BRANCH', $defaultSales)));

        $defaultAudit = $useReal ? 50 : 800;
        $auditRows = max(0, min(50000, (int) env('STRESS_AUDIT_ROWS_PER_TENANT', $defaultAudit)));

        return [
            'use_real_flow' => $useReal,
            'tenants' => $tenants,
            'branches_per_tenant' => $branches,
            'products_per_tenant' => $products,
            'sales_per_branch' => $salesPerBranch,
            'audit_rows_per_tenant' => $auditRows,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSaleLine(int $tenantId, Product $product, float $quantity): array
    {
        $quantity = round($quantity, 3);
        $quantityMilli = (int) round($quantity * 1000);
        $unitPriceCents = Money::decimalToCents($product->price);
        $lineSubtotalCents = intdiv(($quantityMilli * $unitPriceCents) + 500, 1000);
        $lineTaxCents = Money::taxCents($lineSubtotalCents, $product->tax_rate);
        $lineTotalCents = $lineSubtotalCents + $lineTaxCents;

        return [
            'tenant_id' => $tenantId,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => $quantity,
            'unit_price' => Money::centsToDecimal($unitPriceCents),
            'tax_rate' => $product->tax_rate,
            'line_subtotal' => Money::centsToDecimal($lineSubtotalCents),
            'line_tax_total' => Money::centsToDecimal($lineTaxCents),
            'line_total' => Money::centsToDecimal($lineTotalCents),
        ];
    }

    /**
     * @param  array<int, int>  $branchIds
     */
    private function seedAuditNoise(int $tenantId, array $branchIds, int $userId, int $rows): void
    {
        if ($rows === 0 || $branchIds === []) {
            return;
        }

        $events = ['stress.fake.action', 'stress.fake.view', 'stress.fake.export'];
        $entities = [Product::class, Sale::class, Branch::class];
        $batch = [];
        $now = now()->toDateTimeString();

        for ($i = 0; $i < $rows; $i++) {
            $batch[] = [
                'tenant_id' => $tenantId,
                'branch_id' => $branchIds[array_rand($branchIds)],
                'user_id' => $userId,
                'event' => $events[array_rand($events)],
                'entity_type' => $entities[array_rand($entities)],
                'entity_id' => fake()->numberBetween(1, 500_000),
                'metadata' => json_encode(['seed' => 'stress', 'i' => $i]),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($batch) >= 500) {
                DB::table('audit_logs')->insert($batch);
                $batch = [];
            }
        }

        if ($batch !== []) {
            DB::table('audit_logs')->insert($batch);
        }
    }
}
