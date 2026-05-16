<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class IdentifyTenant
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = TenantResolver::resolve($request);

        if ($tenant === null) {
            if ($this->allowedWithoutTenant($request)) {
                return $next($request);
            }

            if (app()->environment('testing')) {
                return $next($request);
            }

            abort(404, 'Negocio no encontrado.');
        }

        if (! $tenant->is_active) {
            abort(404, 'Negocio no encontrado.');
        }

        app()->instance('currentTenant', $tenant);
        $request->attributes->set('tenant', $tenant);
        app()->instance('current_tenant_id', (int) $tenant->id);
        config(['app.current_tenant_id' => $tenant->id]);

        return $next($request);
    }

    private function allowedWithoutTenant(Request $request): bool
    {
        if ($request->is('/')) {
            return true;
        }

        if ($request->is('privacidad', 'terminos')) {
            return true;
        }

        if ($request->is('platform', 'platform/*')) {
            return true;
        }

        if ($request->is('up')) {
            return true;
        }

        // Rutas de invitado (Breeze): sin tenant en vhosts tipo *.test o dominio raíz
        if ($request->is(
            'register',
            'register/*',
            'login',
            'auth/*',
            'forgot-password',
            'reset-password',
            'reset-password/*',
        )) {
            return true;
        }

        if ($request->is('invitacion', 'invitacion/*')) {
            return true;
        }

        return false;
    }
}
