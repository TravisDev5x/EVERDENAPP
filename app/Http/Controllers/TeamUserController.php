<?php

namespace App\Http\Controllers;

use App\Domain\Billing\TenantPlanService;
use App\Http\Requests\StoreTeamUserRequest;
use App\Http\Requests\UpdateTeamUserRequest;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;

class TeamUserController extends Controller
{
    public function store(StoreTeamUserRequest $request, TenantPlanService $tenantPlanService): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        abort_if($tenant === null, 403);

        $tenantPlanService->assertCanCreateUser($tenant);

        User::create([
            'tenant_id' => $tenant->id,
            'branch_id' => $request->validated('branch_id'),
            'role_id' => $request->validated('role_id'),
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ]);

        return back()->with('success', 'Usuario agregado al equipo.');
    }

    public function update(UpdateTeamUserRequest $request, User $user): RedirectResponse
    {
        abort_unless((int) $user->tenant_id === (int) $request->user()->tenant_id, 403);

        $user->update([
            'role_id' => (int) $request->validated('role_id'),
        ]);

        return back()->with('success', 'Rol del usuario actualizado.');
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE), 403);
        abort_unless((int) $user->tenant_id === (int) $request->user()->tenant_id, 403);
        abort_if((int) $user->id === (int) $request->user()->id, 403);

        if ($user->suspended_at !== null) {
            return back()->with('success', 'El usuario ya estaba suspendido.');
        }

        $user->update([
            'suspended_at' => now(),
            'suspension_reason' => 'Suspendido por un administrador del equipo.',
        ]);

        return back()->with('success', 'Usuario suspendido.');
    }

    public function activate(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE), 403);
        abort_unless((int) $user->tenant_id === (int) $request->user()->tenant_id, 403);

        $user->update([
            'suspended_at' => null,
            'suspension_reason' => null,
        ]);

        return back()->with('success', 'Usuario reactivado.');
    }
}
