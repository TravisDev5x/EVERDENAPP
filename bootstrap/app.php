<?php

use App\Models\InventoryTransfer;
use App\Policies\InventoryTransferPolicy;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsurePlatformOperator;
use App\Http\Middleware\EnsureTenantContext;
use App\Http\Middleware\IdentifyTenant;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::bind('product_category', function (string $value): \App\Models\ProductCategory {
                return \App\Models\ProductCategory::withoutGlobalScope('tenant')
                    ->findOrFail($value);
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $proxies = env('TRUSTED_PROXIES');
        if (is_string($proxies) && $proxies !== '') {
            $middleware->trustProxies(
                at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies))
            );
        }

        $middleware->web(prepend: [
            \App\Http\Middleware\ForceHttps::class,
            IdentifyTenant::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'tenant' => IdentifyTenant::class,
            'tenant.context' => EnsureTenantContext::class,
            'platform' => EnsurePlatformOperator::class,
        ]);

        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            EnsureTenantContext::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

$app->booted(function (): void {
    Gate::policy(InventoryTransfer::class, InventoryTransferPolicy::class);
});

return $app;
