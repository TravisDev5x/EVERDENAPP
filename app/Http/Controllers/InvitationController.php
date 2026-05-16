<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Team\ResendInvitationAction;
use App\Actions\Team\SendInvitationAction;
use App\Models\Role;
use App\Models\TenantInvitation;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class InvitationController extends Controller
{
    public function store(Request $request, SendInvitationAction $action): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE), 403);

        $tenantId = (int) $request->user()->tenant_id;

        $validated = $request->validate([
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('tenant_id', $tenantId),
            ],
        ]);

        try {
            $action->execute(
                $request->user(),
                $validated['email'],
                (int) $validated['role_id'],
            );
        } catch (\DomainException $e) {
            return back()->withErrors(['email' => $e->getMessage()]);
        }

        return back()->with('success', 'Invitación enviada.');
    }

    public function resend(
        Request $request,
        TenantInvitation $invitation,
        ResendInvitationAction $action,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE), 403);
        abort_unless((int) $invitation->tenant_id === (int) $request->user()->tenant_id, 403);

        try {
            $action->execute($invitation);
        } catch (\DomainException $e) {
            return back()->withErrors(['resend' => $e->getMessage()]);
        }

        return back()->with('success', 'Invitación reenviada.');
    }

    public function cancel(Request $request, TenantInvitation $invitation): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE), 403);
        abort_unless((int) $invitation->tenant_id === (int) $request->user()->tenant_id, 403);

        if (! $invitation->isPending()) {
            return back()->withErrors(['invitation' => 'Solo se pueden cancelar invitaciones pendientes.']);
        }

        $invitation->update(['status' => 'cancelled']);

        return back()->with('success', 'Invitación cancelada.');
    }
}
