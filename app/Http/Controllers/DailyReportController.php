<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateDailyReportJob;
use App\Services\DailyReportBuilder;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(Request $request, DailyReportBuilder $builder): Response
    {
        abort_unless($request->user()?->hasPermission(Permissions::REPORTS_VIEW), 403);

        $date = Carbon::parse($request->query('date', now()->toDateString()))->startOfDay();
        $tenantId = (int) app('current_tenant_id');
        $branchId = (int) app('current_branch_id');

        $key = DailyReportBuilder::cacheKey($tenantId, $branchId, $date->toDateString());
        $cached = Cache::get($key);

        if ($cached !== null) {
            $data = $cached;
        } else {
            $data = $builder->build($branchId, $date);
            Cache::put($key, $data, now()->addMinutes(10));
        }

        return Inertia::render('Reports/Daily', [
            'date' => $date->toDateString(),
            'activeBranchId' => $branchId,
            ...$data,
        ]);
    }

    public function rebuild(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::REPORTS_VIEW), 403);

        $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $date = Carbon::parse($request->input('date', now()->toDateString()))->startOfDay();
        $tenantId = (int) app('current_tenant_id');
        $branchId = (int) app('current_branch_id');

        $key = DailyReportBuilder::cacheKey($tenantId, $branchId, $date->toDateString());
        Cache::forget($key);

        GenerateDailyReportJob::dispatch($tenantId, $branchId, $date->toDateString());

        return back()->with('success', 'Reporte en cola. Se actualizará en breve (actualiza la página o espera la notificación).');
    }

    public function status(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::REPORTS_VIEW), 403);

        $date = Carbon::parse($request->query('date', now()->toDateString()))->startOfDay();
        $tenantId = (int) app('current_tenant_id');
        $branchId = (int) app('current_branch_id');
        $key = DailyReportBuilder::cacheKey($tenantId, $branchId, $date->toDateString());

        return response()->json([
            'ready' => Cache::has($key),
        ]);
    }
}
