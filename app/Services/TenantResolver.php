<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Http\Request;

final class TenantResolver
{
    /**
     * Resuelve el tenant a partir del host de la petición (subdominio) o,
     * en desarrollo local, del slug configurado en config('tenant.dev_tenant_slug').
     */
    public static function resolve(Request $request): ?Tenant
    {
        $host = strtolower($request->getHost());

        if (self::isPlatformPath($request)) {
            return null;
        }

        if (self::isLocalOrLoopback($host)) {
            $slug = config('tenant.dev_tenant_slug');

            if (! is_string($slug) || $slug === '') {
                return null;
            }

            return Tenant::query()->where('slug', $slug)->first();
        }

        $subdomain = self::extractSubdomain($host);
        if ($subdomain === null || $subdomain === '') {
            return null;
        }

        return Tenant::query()->where('slug', $subdomain)->first();
    }

    private static function isPlatformPath(Request $request): bool
    {
        return $request->is('platform') || $request->is('platform/*');
    }

    private static function isLocalOrLoopback(string $host): bool
    {
        return $host === 'localhost'
            || $host === '127.0.0.1'
            || $host === '::1';
    }

    /**
     * Ej.: "chocolateria.everden.com" → "chocolateria".
     * "everden.com", "localhost" → null.
     * "www.everden.com" → null.
     */
    private static function extractSubdomain(string $host): ?string
    {
        $parts = explode('.', $host);
        $count = count($parts);

        if ($count >= 3) {
            $sub = $parts[0];

            return $sub === 'www' ? null : $sub;
        }

        // Ej. tenant.localhost (sin puerto en host)
        if ($count === 2 && $parts[1] === 'localhost') {
            $sub = $parts[0];

            return $sub === 'www' ? null : $sub;
        }

        return null;
    }
}
