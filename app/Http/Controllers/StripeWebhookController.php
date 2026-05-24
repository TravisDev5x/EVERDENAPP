<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;

final class StripeWebhookController extends CashierWebhookController
{
    /**
     * Pago exitoso → tenant activo
     */
    public function handleInvoicePaymentSucceeded(array $payload): void
    {
        $tenant = $this->getTenantFromPayload($payload);
        if ($tenant === null) {
            return;
        }

        $tenant->update(['status' => 'active']);

        Log::info('Stripe: pago exitoso', [
            'tenant_id' => $tenant->id,
            'tenant' => $tenant->slug,
        ]);
    }

    /**
     * Pago fallido → past_due
     */
    public function handleInvoicePaymentFailed(array $payload): void
    {
        $tenant = $this->getTenantFromPayload($payload);
        if ($tenant === null) {
            return;
        }

        $tenant->update(['status' => 'past_due']);

        Log::warning('Stripe: pago fallido', [
            'tenant_id' => $tenant->id,
            'tenant' => $tenant->slug,
        ]);

        // TODO: enviar email de alerta al admin del tenant
    }

    /**
     * Suscripción cancelada → cancelled
     */
    public function handleCustomerSubscriptionDeleted(array $payload): void
    {
        $tenant = $this->getTenantFromPayload($payload);
        if ($tenant === null) {
            return;
        }

        $tenant->update(['status' => 'cancelled']);

        Log::info('Stripe: suscripción cancelada', [
            'tenant_id' => $tenant->id,
            'tenant' => $tenant->slug,
        ]);

        // TODO: email de confirmación de cancelación
    }

    /**
     * Suscripción actualizada → sincronizar plan
     */
    public function handleCustomerSubscriptionUpdated(array $payload): void
    {
        $tenant = $this->getTenantFromPayload($payload);
        if ($tenant === null) {
            return;
        }

        $stripeStatus = $payload['data']['object']['status'] ?? null;

        $statusMap = [
            'active' => 'active',
            'trialing' => 'trial',
            'past_due' => 'past_due',
            'canceled' => 'cancelled',
            'unpaid' => 'suspended',
        ];

        if ($stripeStatus !== null && isset($statusMap[$stripeStatus])) {
            $tenant->update(['status' => $statusMap[$stripeStatus]]);
        }

        Log::info('Stripe: suscripción actualizada', [
            'tenant_id' => $tenant->id,
            'stripe_status' => $stripeStatus,
        ]);
    }

    /**
     * Trial por terminar → log (email futuro)
     */
    public function handleCustomerSubscriptionTrialWillEnd(array $payload): void
    {
        $tenant = $this->getTenantFromPayload($payload);
        if ($tenant === null) {
            return;
        }

        Log::info('Stripe: trial por terminar en 3 días', [
            'tenant_id' => $tenant->id,
            'tenant' => $tenant->slug,
        ]);

        // TODO: enviar email recordatorio al admin del tenant
    }

    /**
     * Método de pago actualizado → sincronizar datos
     */
    public function handlePaymentMethodUpdated(array $payload): void
    {
        $stripeCustomerId = $payload['data']['object']['customer'] ?? null;

        if ($stripeCustomerId === null) {
            return;
        }

        $tenant = Tenant::query()->where('stripe_id', $stripeCustomerId)->first();

        if ($tenant === null) {
            return;
        }

        $card = $payload['data']['object'] ?? [];

        $tenant->update([
            'pm_type' => $card['card']['brand'] ?? null,
            'pm_last_four' => $card['card']['last4'] ?? null,
        ]);

        Log::info('Stripe: método de pago actualizado', [
            'tenant_id' => $tenant->id,
        ]);
    }

    /**
     * Obtener tenant desde el payload de Stripe usando el customer ID.
     */
    private function getTenantFromPayload(array $payload): ?Tenant
    {
        $stripeCustomerId = $payload['data']['object']['customer'] ?? null;

        if ($stripeCustomerId === null) {
            Log::warning('Stripe webhook: sin customer ID', [
                'event' => $payload['type'] ?? 'unknown',
            ]);

            return null;
        }

        $tenant = Tenant::query()->where('stripe_id', $stripeCustomerId)->first();

        if ($tenant === null) {
            Log::warning('Stripe webhook: tenant no encontrado', [
                'stripe_customer_id' => $stripeCustomerId,
            ]);
        }

        return $tenant;
    }
}
