<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerCustodyService
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly CustomerPrivacyLedger $privacyLedger
    ) {
    }

    public function anonymize(Customer $customer, User $actor, string $reason): Customer
    {
        return DB::transaction(function () use ($customer, $actor, $reason): Customer {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);

            if ($customer->anonymized_at !== null) {
                return $customer;
            }

            $fingerprint = substr(hash_hmac(
                'sha256',
                "{$customer->tenant_id}:{$customer->id}:{$customer->email}:{$customer->phone}:{$customer->tax_id}",
                (string) config('app.key')
            ), 0, 16);

            $customer->forceFill([
                'name' => "Cliente en custodia {$fingerprint}",
                'email' => null,
                'phone' => null,
                'tax_id' => null,
                'notes' => null,
                'privacy_accepted_at' => null,
                'privacy_version' => null,
                'privacy_acceptance_source' => null,
                'marketing_blocked_at' => now(),
                'anonymized_at' => now(),
                'anonymized_by' => $actor->id,
                'updated_by' => $actor->id,
                'custody_reason' => Str::limit($reason, 500, ''),
            ])->save();

            $this->privacyLedger->record(
                customer: $customer,
                event: 'custody.cancelled',
                actor: $actor,
                metadata: [
                    'reason' => Str::limit($reason, 500, ''),
                    'method' => 'irreversible_anonymization',
                    'relationships_preserved' => ['sales', 'payments', 'audit_logs'],
                ]
            );

            $this->auditLogger->log(
                event: 'customer.custody.cancelled',
                entityType: Customer::class,
                entityId: $customer->id,
                actor: $actor,
                metadata: [
                    'reason' => Str::limit($reason, 500, ''),
                    'method' => 'irreversible_anonymization',
                ]
            );

            return $customer->refresh();
        });
    }
}
