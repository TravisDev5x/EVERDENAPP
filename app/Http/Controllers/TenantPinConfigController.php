<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TenantPinConfigController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE),
            403
        );

        $tenant = currentTenant();

        return Inertia::render('Settings/PinConfig', [
            'pin_required_actions' => $tenant->pin_required_actions ?? [],
            'available_actions' => Tenant::availablePinActions(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE),
            403
        );

        $request->validate([
            'pin_required_actions' => 'nullable|array',
            'pin_required_actions.*' => 'string|in:discount,cancel_sale,refund,manual_stock_adjust,cash_open_without_sale,close_cash_session',
        ]);

        currentTenant()->update([
            'pin_required_actions' => $request->pin_required_actions ?? [],
        ]);

        return back()->with('success', 'Configuración de PIN actualizada.');
    }
}
