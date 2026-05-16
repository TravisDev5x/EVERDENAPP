<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Domain\Billing\TenantPlanService;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantRoleBootstrap;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

final class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'El acceso con Google no está configurado.',
            ]);
        }

        $tenant = currentTenant();
        if (! $tenant instanceof Tenant) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'No se pudo identificar el negocio.',
            ]);
        }

        $callback = $request->getSchemeAndHttpHost().'/auth/google/callback';

        return Socialite::driver('google')
            ->redirectUrl($callback)
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->googleOAuthConfigured()) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'El acceso con Google no está configurado.',
            ]);
        }

        $tenant = currentTenant();
        if (! $tenant instanceof Tenant) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'No se pudo identificar el negocio.',
            ]);
        }

        $callback = $request->getSchemeAndHttpHost().'/auth/google/callback';

        try {
            $socialUser = Socialite::driver('google')
                ->redirectUrl($callback)
                ->user();
        } catch (InvalidStateException) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'La sesión con Google expiró o es inválida. Inténtalo de nuevo.',
            ]);
        } catch (\Throwable) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'No se pudo completar el acceso con Google. Inténtalo de nuevo.',
            ]);
        }

        $email = $socialUser->getEmail();
        if ($email === null || $email === '') {
            return redirect()->route('login')->withErrors([
                'oauth' => 'Google no compartió tu correo. Usa el registro con correo y contraseña o revisa los permisos de la cuenta.',
            ]);
        }

        $emailLower = Str::lower($email);
        $sub = $socialUser->getId();
        $name = $socialUser->getName() ?: Str::before($emailLower, '@');
        $avatar = $socialUser->getAvatar();

        $verified = (bool) data_get($socialUser->user, 'verified_email', false);

        $byGoogle = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('google_id', $sub)
            ->first();

        if ($byGoogle !== null) {
            if ($avatar !== null && $avatar !== '') {
                $byGoogle->forceFill(['avatar' => $avatar])->save();
            }

            return $this->finishLogin($request, $byGoogle);
        }

        $byEmail = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', $emailLower)
            ->first();

        if ($byEmail !== null) {
            if (! $verified) {
                return redirect()->route('login')->withErrors([
                    'oauth' => 'Confirma tu correo en Google antes de vincular la cuenta.',
                ]);
            }

            if ($byEmail->google_id !== null && $byEmail->google_id !== $sub) {
                return redirect()->route('login')->withErrors([
                    'oauth' => 'Esta cuenta ya está vinculada a otro perfil de Google.',
                ]);
            }

            $byEmail->forceFill([
                'google_id' => $sub,
                'name' => $byEmail->name !== '' && $byEmail->name !== null ? $byEmail->name : $name,
                'avatar' => $avatar ?: $byEmail->avatar,
                'email_verified_at' => $byEmail->email_verified_at ?? now(),
            ])->save();

            return $this->finishLogin($request, $byEmail);
        }

        if (! $tenant->allow_google_self_registration) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'Tu cuenta no está registrada en '.$tenant->name.'. Contacta al administrador del negocio.',
            ]);
        }

        try {
            app(TenantPlanService::class)->assertCanCreateUser($tenant);
        } catch (ValidationException $e) {
            return redirect()->route('login')->withErrors($e->errors());
        }

        $bootstrap = app(TenantRoleBootstrap::class);
        $bootstrap->syncPermissionCatalog();
        $bootstrap->ensureSystemRolesForTenant($tenant);

        $cajeroRole = Role::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'cajero')
            ->first();

        if ($cajeroRole === null) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'No se pudo asignar un rol al usuario. Contacta soporte.',
            ]);
        }

        $mainBranch = Branch::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderByDesc('is_main')
            ->orderBy('id')
            ->first();

        if ($mainBranch === null) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'El negocio no tiene sucursal activa. Contacta al administrador.',
            ]);
        }

        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $mainBranch->id,
            'role_id' => $cajeroRole->id,
            'name' => $name,
            'email' => $emailLower,
            'google_id' => $sub,
            'avatar' => $avatar ?: null,
            'email_verified_at' => now(),
        ]);

        event(new Registered($user));

        return $this->finishLogin($request, $user);
    }

    protected function finishLogin(Request $request, User $user): RedirectResponse
    {
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        if ($user->is_platform_operator && $user->tenant_id === null) {
            return redirect()->intended(route('platform.tenants.index', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Solo requiere credenciales OAuth; la URL de callback se deriva del host actual.
     */
    protected function googleOAuthConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }
}
