<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cabeceras HTTP alineadas con buenas prácticas OWASP / ISO 27002 (perimetral).
 */
class SecurityHeaders
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! config('security.headers_enabled')) {
            return $response;
        }

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        if ($request->secure()) {
            $maxAge = config('security.hsts_max_age');
            $parts = ["max-age={$maxAge}"];
            if (config('security.hsts_include_subdomains')) {
                $parts[] = 'includeSubDomains';
            }
            if (config('security.hsts_preload')) {
                $parts[] = 'preload';
            }
            $response->headers->set('Strict-Transport-Security', implode('; ', $parts));
        }

        $csp = $this->contentSecurityPolicy($request);
        if ($csp !== '') {
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }

    private function contentSecurityPolicy(Request $request): string
    {
        $appUrl = config('app.url');
        $parsed = parse_url(is_string($appUrl) ? $appUrl : '');
        $origin = '';
        if (is_array($parsed) && isset($parsed['scheme'], $parsed['host'])) {
            $port = isset($parsed['port']) ? ':'.$parsed['port'] : '';
            $origin = $parsed['scheme'].'://'.$parsed['host'].$port;
        }

        if (! app()->isProduction() && ! config('security.csp_in_non_production')) {
            return '';
        }

        $connectExtra = ' https://api.stripe.com https://m.stripe.network https://r.stripe.com https://errors.stripe.com https://hcaptcha.com https://*.hcaptcha.com';

        // Inertia + Vite + Stripe Elements + hCaptcha (fraud) en entornos con CSP activa.
        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://js.stripe.com",
            "font-src 'self' https://fonts.bunny.net data:",
            "img-src 'self' data: blob: https://*.stripe.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com",
            "connect-src 'self'".($origin !== '' ? " {$origin}" : '').$connectExtra,
        ];

        if ($request->secure()) {
            $directives[] = 'upgrade-insecure-requests';
        }

        return implode('; ', $directives);
    }
}
