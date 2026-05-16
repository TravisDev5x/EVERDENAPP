<?php

namespace App\Providers;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Policies\BranchPolicy;
use App\Policies\CashRegisterPolicy;
use App\Policies\CashSessionPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ProductPolicy;
use App\Policies\SalePolicy;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantContext::class, fn () => new TenantContext);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Tenant::class);

        if (config('security.force_https')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Branch::class, BranchPolicy::class);
        Gate::policy(Sale::class, SalePolicy::class);
        Gate::policy(CashRegister::class, CashRegisterPolicy::class);
        Gate::policy(CashSession::class, CashSessionPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);

        // Route model binding sin global scope de tenant.
        // El scope protege listados y queries directas.
        // Para recursos individuales por ruta, los Policies y abort_unless
        // son la barrera de seguridad (lanzan 403, no 404).
        Route::bind('product', function (string $value): Product {
            return Product::withoutGlobalScope('tenant')
                ->findOrFail($value);
        });

        Route::bind('sale', function (string $value): Sale {
            return Sale::withoutGlobalScope('tenant')
                ->findOrFail($value);
        });
    }
}
