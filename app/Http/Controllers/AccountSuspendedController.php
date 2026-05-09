<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountSuspendedController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if ($user->is_platform_operator && $user->tenant_id === null) {
            return redirect()->route('platform.tenants.index');
        }

        if ($user->tenant_id === null) {
            abort(403);
        }

        $tenant = Tenant::query()->find($user->tenant_id);

        if ($tenant === null) {
            abort(403);
        }

        if ($tenant->is_active) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Account/Suspended', [
            'tenantDisplayName' => $tenant->trade_name ?? $tenant->name,
            'suspensionReason' => $tenant->suspension_reason,
        ]);
    }
}
