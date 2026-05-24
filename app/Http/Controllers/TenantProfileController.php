<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TenantProfileController extends Controller
{
    public function edit(): Response
    {
        $tenant = currentTenant();
        $tenant->load('plan');

        return Inertia::render('Settings/BusinessProfile', [
            'tenant' => [
                'name' => $tenant->name,
                'trade_name' => $tenant->trade_name,
                'business_type' => $tenant->business_type,
                'phone' => $tenant->phone,
                'whatsapp' => $tenant->whatsapp,
                'contact_email' => $tenant->contact_email,
                'website' => $tenant->website,
                'street' => $tenant->street,
                'neighborhood' => $tenant->neighborhood,
                'city' => $tenant->city,
                'state' => $tenant->state,
                'zip_code' => $tenant->zip_code,
                'rfc' => $tenant->rfc,
                'ticket_footer' => $tenant->ticket_footer,
                'timezone' => $tenant->timezone,
                'completion' => $tenant->profileCompletionPercentage(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'trade_name' => 'nullable|string|max:150',
            'business_type' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'whatsapp' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email|max:100',
            'website' => 'nullable|url|max:200',
            'street' => 'nullable|string|max:200',
            'neighborhood' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:10',
            'rfc' => 'nullable|string|max:13',
            'ticket_footer' => 'nullable|string|max:200',
            'timezone' => 'nullable|string|max:50',
        ]);

        $tenant = currentTenant();
        $tenant->update($validated);

        if ($tenant->profileCompletionPercentage() >= 80
            && ! $tenant->profile_completed_at) {
            $tenant->update([
                'profile_completed_at' => now(),
            ]);
        }

        return back()->with('success', 'Perfil del negocio actualizado correctamente.');
    }
}
