<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('login')->with('error', 'El acceso con Google no está configurado.');
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('login')->with('error', 'El acceso con Google no está configurado.');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException) {
            return redirect()->route('login')->with('error', 'La sesión con Google expiró o es inválida. Inténtalo de nuevo.');
        } catch (\Throwable) {
            return redirect()->route('login')->with('error', 'No se pudo completar el acceso con Google. Inténtalo de nuevo.');
        }

        $sub = $googleUser->getId();
        $email = $googleUser->getEmail();

        if ($email === null || $email === '') {
            return redirect()->route('login')->with(
                'error',
                'Google no compartió tu correo. Usa el registro con correo y contraseña o revisa los permisos de la cuenta.'
            );
        }

        $emailLower = Str::lower($email);
        $name = $googleUser->getName() ?: Str::before($emailLower, '@');
        $verified = (bool) data_get($googleUser->user, 'verified_email', false);

        $existingByGoogle = User::query()->where('google_id', $sub)->first();
        if ($existingByGoogle !== null) {
            return $this->finishLogin($request, $existingByGoogle);
        }

        $sameEmail = User::query()->where('email', $emailLower)->get();
        if ($sameEmail->count() > 1) {
            return redirect()->route('login')->with(
                'error',
                'Hay varias cuentas con este correo. Inicia sesión con correo y contraseña o contacta soporte.'
            );
        }

        if ($sameEmail->count() === 1) {
            $user = $sameEmail->first();
            if (! $verified) {
                return redirect()->route('login')->with(
                    'error',
                    'Confirma tu correo en Google antes de vincular la cuenta.'
                );
            }

            if ($user->google_id !== null && $user->google_id !== $sub) {
                return redirect()->route('login')->with(
                    'error',
                    'Esta cuenta ya está vinculada a otro perfil de Google.'
                );
            }

            $user->forceFill([
                'google_id' => $sub,
                'name' => $user->name !== '' && $user->name !== null ? $user->name : $name,
            ])->save();

            return $this->finishLogin($request, $user);
        }

        $request->session()->put('google_register', [
            'sub' => $sub,
            'email' => $emailLower,
            'name' => $name,
            'email_verified' => $verified,
        ]);

        return redirect()->route('register.google');
    }

    /**
     * @return RedirectResponse
     */
    protected function finishLogin(Request $request, User $user): RedirectResponse
    {
        Auth::login($user, remember: false);
        $request->session()->regenerate();

        if ($user->is_platform_operator && $user->tenant_id === null) {
            return redirect()->intended(route('platform.tenants.index', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    protected function googleOAuthConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
