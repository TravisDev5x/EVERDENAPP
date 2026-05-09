<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\SuspendTenantRequest;
use App\Http\Requests\Platform\UpdateTenantMetadataRequest;
use App\Http\Requests\Platform\UpdateTenantPlanRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TenantDirectoryController extends Controller
{
    public function index(Request $request): Response
    {
        $paginator = Tenant::query()
            ->select([
                'id',
                'name',
                'trade_name',
                'slug',
                'is_active',
                'suspended_at',
                'suspension_reason',
                'plan_slug',
                'max_users',
                'max_branches',
            ])
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Tenant $tenant): array => $this->buildTenantPayload($tenant)),
        );

        return Inertia::render('Platform/TenantsIndex', [
            'tenants' => $paginator,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTenantPayload(Tenant $tenant): array
    {
        $usersCount = User::query()->where('tenant_id', $tenant->id)->count();

        $roleRows = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->where('users.tenant_id', $tenant->id)
            ->whereNotNull('users.role_id')
            ->groupBy('roles.id', 'roles.slug', 'roles.name')
            ->selectRaw('roles.slug as slug, roles.name as name, count(*) as user_count')
            ->orderBy('roles.slug')
            ->get();

        $withoutRole = User::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('role_id')
            ->count();

        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'trade_name' => $tenant->trade_name,
            'slug' => $tenant->slug,
            'is_active' => $tenant->is_active,
            'suspended_at' => $tenant->suspended_at?->toIso8601String(),
            'suspension_reason' => $tenant->suspension_reason,
            'users_count' => $usersCount,
            'roles_breakdown' => $roleRows->map(fn ($r): array => [
                'slug' => $r->slug,
                'name' => $r->name,
                'count' => (int) $r->user_count,
            ])->values()->all(),
            'users_without_role' => $withoutRole,
            'plan_slug' => $tenant->plan_slug,
            'max_users' => $tenant->max_users,
            'max_branches' => $tenant->max_branches,
        ];
    }

    public function updateMetadata(UpdateTenantMetadataRequest $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update([
            'name' => $request->validated('name'),
            'trade_name' => $request->validated('trade_name'),
        ]);

        return back()->with('success', 'Datos del tenant actualizados.');
    }

    public function updatePlan(UpdateTenantPlanRequest $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update($request->validated());

        return back()->with('success', 'Plan y límites actualizados.');
    }

    public function suspend(SuspendTenantRequest $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update([
            'is_active' => false,
            'suspended_at' => now(),
            'suspension_reason' => $request->validated('reason'),
        ]);

        return back()->with('success', 'Tenant suspendido. Los usuarios no podrán operar hasta reactivación.');
    }

    public function activate(Request $request, Tenant $tenant): RedirectResponse
    {
        abort_unless($request->user()?->is_platform_operator, 403);

        $tenant->update([
            'is_active' => true,
            'suspended_at' => null,
            'suspension_reason' => null,
        ]);

        return back()->with('success', 'Tenant reactivado.');
    }
}
