<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $permissionKeys = [];
        if ($user !== null) {
            $user->loadMissing('tenantRole.permissions');
            $permissionKeys = $user->tenantRole?->permissions->pluck('key')->values()->all() ?? [];
        }

        return [
            ...parent::share($request),
            'appName' => config('app.name'),
            /** URL pública base (sin barra final) para OG/meta y enlaces absolutos */
            'siteUrl' => rtrim((string) config('app.url'), '/'),
            'auth' => [
                'user' => $user,
                'permissionKeys' => $permissionKeys,
                'isPlatformOperator' => (bool) ($user?->is_platform_operator ?? false),
            ],
            'tenant' => static function () use ($request) {
                try {
                    $tenant = currentTenant();
                } catch (\Throwable) {
                    return null;
                }

                if ($tenant === null) {
                    $u = $request->user();
                    if ($u === null || $u->tenant_id === null) {
                        return null;
                    }
                    $tenant = Tenant::query()->with('plan')->find($u->tenant_id);
                } else {
                    $tenant->loadMissing('plan');
                }

                if ($tenant === null) {
                    return null;
                }

                $displayName = $tenant->trade_name ?: $tenant->name;
                $isOnTrial = $tenant->status === 'trial'
                    && $tenant->trial_ends_at?->isFuture();
                $trialDaysLeft = $tenant->status === 'trial' && $tenant->trial_ends_at
                    ? max(0, (int) now()->diffInDays($tenant->trial_ends_at, false))
                    : 0;

                return [
                    'name' => $displayName,
                    'slug' => $tenant->slug,
                    'currency_code' => $tenant->currency_code ?? 'MXN',
                    'status' => $tenant->status,
                    'is_on_trial' => $isOnTrial,
                    'trial_days_left' => $trialDaysLeft,
                    'plan' => $tenant->plan?->name,
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
