<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerPrivacyEvent;
use App\Models\User;

class CustomerPrivacyLedger
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function record(
        Customer $customer,
        string $event,
        ?User $actor,
        array $metadata = [],
        ?string $privacyVersion = null
    ): CustomerPrivacyEvent {
        return CustomerPrivacyEvent::query()->create([
            'tenant_id' => $customer->tenant_id,
            'branch_id' => app()->bound('current_branch_id') ? app('current_branch_id') : $customer->branch_id,
            'customer_id' => $customer->id,
            'user_id' => $actor?->id,
            'event' => $event,
            'privacy_version' => $privacyVersion ?? $customer->privacy_version,
            'metadata' => $metadata,
            'occurred_at' => now(),
        ]);
    }
}
