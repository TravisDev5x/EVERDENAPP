<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class UserProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/UserProfile', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'whatsapp' => $user->whatsapp,
                'employee_number' => $user->employee_number,
                'birth_date' => $user->birth_date?->format('Y-m-d'),
                'hire_date' => $user->hire_date?->format('Y-m-d'),
                'avatar' => $user->avatar,
                'has_pin' => $user->hasPin(),
                'pin_set_at' => $user->pin_set_at?->toDateTimeString(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'whatsapp' => 'nullable|string|max:20',
            'employee_number' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date|before:today',
            'hire_date' => 'nullable|date',
        ]);

        $request->user()->update($validated);

        return back()->with('success', 'Perfil actualizado correctamente.');
    }

    public function setPin(Request $request): RedirectResponse
    {
        $request->validate([
            'pin' => 'required|string|size:4|confirmed|regex:/^[0-9]{4}$/',
            'pin_confirmation' => 'required',
            'current_password' => 'required|current_password',
        ], [
            'pin.size' => 'El PIN debe tener exactamente 4 dígitos.',
            'pin.regex' => 'El PIN solo puede contener números.',
        ]);

        $request->user()->setPin($request->pin);

        return back()->with('success', 'PIN configurado correctamente.');
    }

    public function clearPin(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|current_password',
        ]);

        $request->user()->clearPin();

        return back()->with('success', 'PIN eliminado correctamente.');
    }
}
