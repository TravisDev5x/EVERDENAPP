<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\RegisterTenantOwnerAction;
use App\Http\Controllers\Controller;
use App\Mail\WelcomeMail;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('price_mxn')
            ->get([
                'id', 'name', 'slug', 'price_mxn', 'max_users',
                'max_products', 'max_branches', 'has_offline_mode',
                'has_advanced_reports', 'has_api_access',
            ]);

        return Inertia::render('Auth/Register', [
            'plans' => $plans,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $billStripe = $this->mustBillWithStripe();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'business_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'privacy_notice_accepted' => ['accepted'],
            'main_branch_name' => ['nullable', 'string', 'max:100'],
        ];

        if ($billStripe) {
            $rules['plan_id'] = ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)];
            $rules['payment_method'] = ['required', 'string', 'max:255'];
        }

        $request->validate($rules);

        $user = DB::transaction(function () use ($request, $billStripe): User {
            $user = app(RegisterTenantOwnerAction::class)->execute([
                'name' => $request->string('name')->toString(),
                'business_name' => $request->string('business_name')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'main_branch_name' => $request->filled('main_branch_name')
                    ? $request->string('main_branch_name')->toString()
                    : null,
            ]);

            if ($billStripe) {
                $plan = Plan::query()->whereKey($request->integer('plan_id'))->firstOrFail();

                if (! is_string($plan->stripe_price_id) || $plan->stripe_price_id === '') {
                    throw ValidationException::withMessages([
                        'plan_id' => 'El plan seleccionado no tiene precio de Stripe configurado.',
                    ]);
                }

                $tenant = $user->tenant;
                if (! $tenant instanceof Tenant) {
                    throw new \RuntimeException('Tenant no encontrado tras el registro.');
                }

                try {
                    $this->setupStripeSubscription(
                        $tenant,
                        $plan,
                        $request->string('payment_method')->toString()
                    );
                } catch (Throwable $e) {
                    report($e);

                    throw $e;
                }
            }

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        $tenant = $user->tenant;
        if ($tenant instanceof Tenant) {
            try {
                Mail::to($user->email)->send(new WelcomeMail($user, $tenant->name));
            } catch (\Exception $e) {
                Log::warning('WelcomeMail falló: '.$e->getMessage());
            }
        }

        if (! $tenant instanceof Tenant) {
            return redirect()->route('dashboard');
        }

        return $this->redirectAfterRegistration($tenant);
    }

    private function mustBillWithStripe(): bool
    {
        if (app()->environment('testing')) {
            return false;
        }

        return filled(config('cashier.secret'));
    }

    private function setupStripeSubscription(Tenant $tenant, Plan $plan, string $paymentMethod): void
    {
        $tenant->createOrGetStripeCustomer([
            'name' => $tenant->name,
            'email' => $tenant->users()->first()?->email,
        ]);
        $tenant->addPaymentMethod($paymentMethod);
        $tenant->updateDefaultPaymentMethod($paymentMethod);
        $subscription = $tenant->newSubscription('default', $plan->stripe_price_id)
            ->trialDays(7)
            ->create($paymentMethod);

        $tenant->forceFill([
            'plan_id' => $plan->id,
            'status' => 'trial',
            'trial_ends_at' => $subscription->trial_ends_at ?? now()->addDays(7),
        ])->save();
    }

    private function redirectAfterRegistration(Tenant $tenant): RedirectResponse
    {
        $domain = config('app.domain');
        if (is_string($domain) && $domain !== '') {
            $scheme = str_starts_with((string) config('app.url'), 'https') ? 'https' : 'http';

            return redirect()->away("{$scheme}://{$tenant->slug}.{$domain}/dashboard");
        }

        return redirect()->route('dashboard');
    }
}
