<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Role;
use App\Models\TenantInvitation;
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
            ->with(['tenantRole:id,name,slug,is_system', 'branch:id,name'])
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

        $invitations = TenantInvitation::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'rejected'])
            ->with(['role:id,name', 'invitedBy:id,name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (TenantInvitation $invitation): array => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at?->toDateString(),
                'rejection_reason' => $invitation->rejection_reason,
                'can_resend' => $invitation->canResend(),
                'whatsapp_url' => $invitation->isPending() ? $invitation->whatsappShareUrl() : null,
                'role' => $invitation->role ? ['name' => $invitation->role->name] : null,
                'invited_by' => $invitation->invitedBy ? ['name' => $invitation->invitedBy->name] : null,
            ]);

        return Inertia::render('Team/Users', [
            'users' => $users,
            'roles' => $roles,
            'branches' => $branches,
            'invitations' => $invitations,
            'canManageUsers' => $request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE) ?? false,
        ]);
    }
}
