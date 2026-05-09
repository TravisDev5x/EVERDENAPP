<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamRoleRequest;
use App\Http\Requests\SyncTeamRolePermissionsRequest;
use App\Http\Requests\UpdateTeamRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TeamRoleController extends Controller
{
    public function store(StoreTeamRoleRequest $request): RedirectResponse
    {
        $tenantId = (int) $request->user()->tenant_id;
        $name = (string) $request->validated('name');
        $slug = $request->validated('slug');
        $slug = $slug !== null && $slug !== ''
            ? Str::lower((string) $slug)
            : Str::slug($name);

        $baseSlug = $slug !== '' ? $slug : 'rol';
        $slug = $baseSlug;
        $n = 1;
        while (
            Role::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('slug', $slug)
                ->exists()
        ) {
            $n++;
            $slug = "{$baseSlug}-{$n}";
        }

        $reserved = ['owner', 'admin', 'supervisor', 'cajero'];
        if (in_array($slug, $reserved, true)) {
            return back()->withErrors(['slug' => 'Ese identificador está reservado para roles de sistema.']);
        }

        Role::query()->create([
            'tenant_id' => $tenantId,
            'slug' => $slug,
            'name' => $name,
            'description' => $request->validated('description'),
            'is_system' => false,
        ]);

        return back()->with('success', 'Rol creado. Asigna permisos en la matriz.');
    }

    public function update(UpdateTeamRoleRequest $request, Role $role): RedirectResponse
    {
        $this->ensureSameTenant($request, $role);

        if ($role->is_system) {
            $role->update($request->only(['description']));
        } else {
            $role->update($request->only(['name', 'description']));
        }

        return back()->with('success', 'Rol actualizado.');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_ROLES_MANAGE), 403);

        $this->ensureSameTenant($request, $role);

        if ($role->is_system) {
            return back()->withErrors(['role' => 'No se pueden eliminar roles de sistema.']);
        }

        if ($role->users()->exists()) {
            return back()->withErrors(['role' => 'No puedes eliminar un rol con usuarios asignados.']);
        }

        $role->delete();

        return back()->with('success', 'Rol eliminado.');
    }

    public function syncPermissions(SyncTeamRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        $this->ensureSameTenant($request, $role);

        $keys = $request->validated('permission_keys');
        $ids = Permission::query()->whereIn('key', $keys)->pluck('id')->all();
        $role->permissions()->sync($ids);

        return back()->with('success', 'Permisos del rol actualizados.');
    }

    private function ensureSameTenant(\Illuminate\Http\Request $request, Role $role): void
    {
        abort_unless((int) $role->tenant_id === (int) $request->user()->tenant_id, 403);
    }
}
