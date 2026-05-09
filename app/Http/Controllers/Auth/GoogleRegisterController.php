<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\RegisterTenantOwnerAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GoogleRegisterController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('register')->with('error', 'El acceso con Google no está configurado.');
        }

        $payload = $request->session()->get('google_register');
        if (! is_array($payload) || empty($payload['sub']) || empty($payload['email'])) {
            return redirect()->route('register')->with('error', 'Primero continúa con Google para completar el registro.');
        }

        return Inertia::render('Auth/RegisterGoogle', [
            'prefill' => [
                'name' => (string) ($payload['name'] ?? ''),
                'email' => (string) $payload['email'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('register')->with('error', 'El acceso con Google no está configurado.');
        }

        $payload = $request->session()->get('google_register');
        if (! is_array($payload) || empty($payload['sub']) || empty($payload['email'])) {
            return redirect()->route('register')->with(
                'error',
                'La sesión de registro con Google caducó. Vuelve a iniciar con Google.'
            );
        }

        $request->merge([
            'name' => Str::squish((string) $request->input('name', '')),
            'business_name' => Str::squish((string) $request->input('business_name', '')),
            'main_branch_name' => Str::squish((string) $request->input('main_branch_name', '')),
        ]);

        $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'business_name' => ['required', 'string', 'min:2', 'max:255'],
            'main_branch_name' => ['required', 'string', 'min:2', 'max:255'],
            'privacy_notice_accepted' => ['accepted'],
        ]);

        $sub = (string) $payload['sub'];
        $email = Str::lower((string) $payload['email']);

        if (User::query()->where('google_id', $sub)->exists()) {
            $request->session()->forget('google_register');

            return redirect()->route('login')->with('error', 'Esta cuenta de Google ya está registrada. Inicia sesión.');
        }

        if (User::query()->where('email', $email)->exists()) {
            $request->session()->forget('google_register');

            return redirect()->route('login')->with('error', 'Ya existe una cuenta con este correo. Inicia sesión.');
        }

        $verified = (bool) ($payload['email_verified'] ?? false);

        $user = app(RegisterTenantOwnerAction::class)->execute([
            'name' => $request->string('name')->toString(),
            'business_name' => $request->string('business_name')->toString(),
            'main_branch_name' => $request->string('main_branch_name')->toString(),
            'email' => $email,
            'password' => null,
            'google_id' => $sub,
            'email_verified_at' => $verified ? now() : null,
        ]);

        $request->session()->forget('google_register');

        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard', absolute: false);
    }

    protected function googleOAuthConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
