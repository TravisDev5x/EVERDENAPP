<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\SuspendTenantUserRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantUsersController extends Controller
{
    public function index(Request $request, Tenant $tenant): Response
    {
        abort_unless($request->user()?->is_platform_operator, 403);

        $paginator = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_platform_operator', false)
            ->with(['tenantRole:id,name,slug'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (User $u): array {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role_name' => $u->tenantRole?->name,
                    'role_slug' => $u->tenantRole?->slug,
                    'suspended_at' => $u->suspended_at?->toIso8601String(),
                    'suspension_reason' => $u->suspension_reason,
                ];
            }),
        );

        return Inertia::render('Platform/TenantUsers', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->trade_name ?: $tenant->name,
                'slug' => $tenant->slug,
                'is_active' => $tenant->is_active,
            ],
            'users' => $paginator,
        ]);
    }

    public function suspend(SuspendTenantUserRequest $request, Tenant $tenant, User $user): RedirectResponse
    {
        abort_if((int) $user->id === (int) $request->user()->id, 403);

        $user->forceFill([
            'suspended_at' => now(),
            'suspension_reason' => $request->validated('reason'),
        ])->save();

        return back()->with('success', 'Usuario suspendido. No podrá operar la app del negocio hasta reactivación.');
    }

    public function activate(Request $request, Tenant $tenant, User $user): RedirectResponse
    {
        abort_unless($request->user()?->is_platform_operator, 403);
        abort_unless((int) $user->tenant_id === (int) $tenant->id, 403);
        abort_if($user->is_platform_operator, 403);

        $user->forceFill([
            'suspended_at' => null,
            'suspension_reason' => null,
        ])->save();

        return back()->with('success', 'Usuario reactivado.');
    }
}
