<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Team\AcceptInvitationAction;
use App\Actions\Team\RejectInvitationAction;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

final class InvitationPublicController extends Controller
{
    public function show(string $token): Response
    {
        $invitation = $this->findByToken($token);

        if ($invitation === null) {
            return Inertia::render('Invitations/Invalid', ['reason' => 'no_existe']);
        }

        if ($invitation->isExpired() || $invitation->status === 'expired') {
            return Inertia::render('Invitations/Invalid', ['reason' => 'expirada']);
        }

        if (! $invitation->isPending()) {
            return Inertia::render('Invitations/Invalid', ['reason' => $invitation->status]);
        }

        $invitation->load(['tenant', 'role', 'invitedBy']);

        return Inertia::render('Invitations/Accept', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'tenant_name' => $invitation->tenant?->name ?? '',
                'role_name' => $invitation->role?->name ?? '',
                'invited_by' => $invitation->invitedBy?->name ?? '',
                'expires_at' => $invitation->expires_at?->toDateString(),
            ],
        ]);
    }

    public function accept(
        Request $request,
        string $token,
        AcceptInvitationAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $invitation = $this->findPendingValid($token);
        if ($invitation === null) {
            return back()->withErrors(['email' => 'Invitación no válida o expirada.']);
        }

        try {
            $user = $action->execute(
                $invitation,
                $validated['name'],
                $validated['password'],
            );
        } catch (\DomainException $e) {
            return back()->withErrors(['name' => $e->getMessage()]);
        }

        Auth::login($user);

        return $this->redirectToTenantDashboard($invitation->load('tenant')->tenant);
    }

    public function reject(
        Request $request,
        string $token,
        RejectInvitationAction $action,
    ): Response {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $invitation = $this->findPendingValid($token);
        if ($invitation === null) {
            return Inertia::render('Invitations/Invalid', ['reason' => 'no_existe']);
        }

        try {
            $action->execute($invitation, $validated['reason']);
        } catch (\DomainException $e) {
            return Inertia::render('Invitations/Invalid', ['reason' => 'expirada']);
        }

        return Inertia::render('Invitations/Rejected');
    }

    private function findByToken(string $token): ?TenantInvitation
    {
        return TenantInvitation::withoutGlobalScopes()
            ->where('token', $token)
            ->first();
    }

    private function findPendingValid(string $token): ?TenantInvitation
    {
        $invitation = $this->findByToken($token);
        if ($invitation === null || ! $invitation->isPending() || $invitation->isExpired()) {
            return null;
        }

        return $invitation;
    }

    private function redirectToTenantDashboard(?Tenant $tenant): RedirectResponse
    {
        if ($tenant === null) {
            return redirect()->route('dashboard');
        }

        $domain = config('app.domain');
        if (is_string($domain) && $domain !== '') {
            $scheme = str_starts_with((string) config('app.url'), 'https') ? 'https' : 'http';

            return redirect()->away("{$scheme}://{$tenant->slug}.{$domain}/dashboard");
        }

        return redirect()->route('dashboard');
    }
}
