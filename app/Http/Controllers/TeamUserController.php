<?php

namespace App\Http\Controllers;

use App\Domain\Billing\TenantPlanService;
use App\Http\Requests\StoreTeamUserRequest;
use App\Http\Requests\UpdateTeamUserRequest;
use App\Models\User;
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
}
