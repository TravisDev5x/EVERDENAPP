<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

final class BillingController extends Controller
{
    public function index(): Response
    {
        $tenant = currentTenant();
        abort_if(! $tenant instanceof Tenant, 404);

        $tenant->load('plan');

        $subscription = $tenant->subscription('default');

        $billingPortalUrl = null;
        if ($tenant->stripe_id) {
            try {
                $billingPortalUrl = $tenant->billingPortalUrl(route('tenant.billing'));
            } catch (\Throwable) {
                $billingPortalUrl = null;
            }
        }

        return Inertia::render('Billing/Index', [
            'tenant' => [
                'name' => $tenant->name,
                'status' => $tenant->status,
                'is_on_trial' => $tenant->status === 'trial'
                    && $tenant->trial_ends_at?->isFuture(),
                'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
                'trial_days_left' => $tenant->trialDaysRemaining(),
                'pm_type' => $tenant->pm_type,
                'pm_last_four' => $tenant->pm_last_four,
                'plan' => $tenant->plan ? [
                    'name' => $tenant->plan->name,
                    'price_mxn' => $tenant->plan->price_mxn,
                    'slug' => $tenant->plan->slug,
                ] : null,
            ],
            'subscription' => $subscription ? [
                'stripe_status' => $subscription->stripe_status,
                'ends_at' => $subscription->ends_at?->toDateString(),
                'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
            ] : null,
            'billing_portal_url' => $billingPortalUrl,
        ]);
    }
}
