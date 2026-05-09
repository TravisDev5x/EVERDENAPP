<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamRolePageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_ROLES_VIEW), 403);

        $tenantId = (int) $request->user()->tenant_id;

        $permissions = Permission::query()
            ->orderBy('sort_order')
            ->orderBy('group')
            ->get(['id', 'key', 'group', 'label', 'sort_order']);

        $permissionsGrouped = $permissions->groupBy('group')->map(fn ($items) => $items->values())->toArray();

        $roles = Role::query()
            ->with(['permissions:id,key'])
            ->where('tenant_id', $tenantId)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'is_system']);

        $matrix = $roles->map(fn (Role $role): array => [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'is_system' => $role->is_system,
            'description' => $role->description,
            'permission_keys' => $role->permissions->pluck('key')->values()->all(),
        ]);

        return Inertia::render('Team/Roles', [
            'permissions' => $permissions,
            'permissionsGrouped' => $permissionsGrouped,
            'roles' => $roles,
            'matrix' => $matrix,
            'permissionCatalog' => Permissions::definitions(),
            'canManageRoles' => $request->user()?->hasPermission(Permissions::TEAM_ROLES_MANAGE) ?? false,
        ]);
    }
}
