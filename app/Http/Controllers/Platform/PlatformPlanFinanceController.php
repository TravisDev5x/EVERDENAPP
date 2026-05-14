<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformPlanFinanceController extends Controller
{
    public function index(): Response
    {
        $prices = config('platform_plans.monthly_price_mxn', []);
        $defaultPrice = (float) config('platform_plans.default_monthly_mxn', 0);
        $currency = (string) config('platform_plans.currency_code', 'MXN');

        $activeByPlan = Tenant::query()
            ->where('is_active', true)
            ->selectRaw('plan_slug, COUNT(*) as tenant_count')
            ->groupBy('plan_slug')
            ->orderBy('plan_slug')
            ->get();

        $rows = [];
        $totalMrr = 0.0;
        foreach ($activeByPlan as $row) {
            $slug = (string) $row->plan_slug;
            $count = (int) $row->tenant_count;
            $unit = isset($prices[$slug]) ? (float) $prices[$slug] : $defaultPrice;
            $mrr = round($count * $unit, 2);
            $totalMrr += $mrr;
            $rows[] = [
                'plan_slug' => $slug,
                'tenant_count' => $count,
                'monthly_price_mxn' => round($unit, 2),
                'mrr_mxn' => $mrr,
            ];
        }

        $suspendedTenants = Tenant::query()->where('is_active', false)->count();
        $activeTenants = Tenant::query()->where('is_active', true)->count();

        $suspendedUsers = DB::table('users')
            ->whereNotNull('suspended_at')
            ->whereNotNull('tenant_id')
            ->count();

        return Inertia::render('Platform/PlanFinance', [
            'currency_code' => $currency,
            'plan_rows' => $rows,
            'total_mrr_mxn' => round($totalMrr, 2),
            'active_tenants' => $activeTenants,
            'suspended_tenants' => $suspendedTenants,
            'suspended_users' => $suspendedUsers,
        ]);
    }
}
