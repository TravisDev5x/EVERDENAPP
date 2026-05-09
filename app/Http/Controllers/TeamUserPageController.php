<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamUserPageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_VIEW), 403);

        $tenantId = (int) $request->user()->tenant_id;

        $users = User::query()
            ->where('tenant_id', $tenantId)
            ->with('tenantRole:id,name,slug,is_system')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $roles = Role::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'is_system']);

        $branches = Branch::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc('is_main')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Team/Users', [
            'users' => $users,
            'roles' => $roles,
            'branches' => $branches,
            'canManageUsers' => $request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE) ?? false,
        ]);
    }
}
