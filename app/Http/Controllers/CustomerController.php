<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use App\Services\AuditLogger;
use App\Services\CustomerCustodyService;
use App\Services\CustomerPrivacyLedger;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function store(
        Request $request,
        AuditLogger $auditLogger,
        CustomerPrivacyLedger $privacyLedger
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE), 403);

        $data = $this->validatedCustomerData($request);
        $privacyAccepted = (bool) data_get($data, 'privacy_accepted', false);
        $saleId = data_get($data, 'sale_id');
        unset($data['privacy_accepted'], $data['sale_id']);

        $customer = DB::transaction(function () use ($request, $data, $privacyAccepted, $saleId, $privacyLedger): Customer {
            $customer = Customer::query()->create(array_merge($data, [
                'branch_id' => app('current_branch_id'),
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
                'privacy_accepted_at' => $privacyAccepted ? now() : null,
                'privacy_version' => $privacyAccepted ? config('privacy.customer_notice_version', 'everden-mx-v1') : null,
                'privacy_acceptance_source' => $privacyAccepted ? 'pos' : null,
            ]));

            if ($privacyAccepted) {
                $privacyLedger->record(
                    customer: $customer,
                    event: 'privacy.accepted',
                    actor: $request->user(),
                    metadata: [
                        'source' => 'pos',
                        'captured_during_sale_id' => $saleId,
                    ]
                );
            }

            if ($saleId) {
                $sale = Sale::query()->findOrFail((int) $saleId);
                abort_unless((int) $sale->tenant_id === (int) $request->user()->tenant_id, 403);
                abort_unless((int) $sale->branch_id === (int) app('current_branch_id'), 403);
                abort_unless($sale->isDraft(), 409, 'Solo puedes asociar clientes a tickets en borrador.');

                $sale->update(['customer_id' => $customer->id]);
            }

            return $customer;
        });

        $auditLogger->log(
            event: 'customer.created',
            entityType: Customer::class,
            entityId: $customer->id,
            actor: $request->user(),
            metadata: [
                'branch_id' => $customer->branch_id,
                'privacy_accepted' => $privacyAccepted,
                'sale_id' => $saleId,
            ]
        );

        return back()->with('success', 'Cliente registrado bajo Custodia Everden.');
    }

    public function update(Request $request, Customer $customer, AuditLogger $auditLogger): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE), 403);
        abort_if($customer->isInCustody(), 409, 'Este cliente ya esta bajo Custodia y no puede rectificarse.');

        $data = $this->validatedCustomerData($request, includePrivacy: false);

        $customer->update(array_merge($data, [
            'updated_by' => $request->user()->id,
        ]));

        $auditLogger->log(
            event: 'customer.rectified',
            entityType: Customer::class,
            entityId: $customer->id,
            actor: $request->user(),
            metadata: [
                'fields' => array_keys($data),
            ]
        );

        return back()->with('success', 'Datos del cliente rectificados.');
    }

    public function export(Request $request, Customer $customer, CustomerPrivacyLedger $privacyLedger): JsonResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_VIEW), 403);

        $customer->load([
            'sales:id,customer_id,status,payment_status,total,created_at,paid_at',
            'privacyEvents:id,customer_id,event,privacy_version,metadata,occurred_at',
        ]);

        $privacyLedger->record(
            customer: $customer,
            event: 'arco.access.exported',
            actor: $request->user(),
            metadata: ['format' => 'json']
        );

        return response()->json([
            'exported_at' => now()->toIso8601String(),
            'tenant_id' => $customer->tenant_id,
            'customer' => $customer->only([
                'id',
                'name',
                'email',
                'phone',
                'tax_id',
                'notes',
                'privacy_accepted_at',
                'privacy_version',
                'marketing_blocked_at',
                'anonymized_at',
                'custody_reason',
                'created_at',
                'updated_at',
            ]),
            'sales' => $customer->sales,
            'privacy_events' => $customer->privacyEvents,
        ]);
    }

    public function opposeMarketing(Request $request, Customer $customer, CustomerPrivacyLedger $privacyLedger): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE), 403);
        abort_if($customer->isInCustody(), 409, 'Este cliente ya esta bajo Custodia.');

        $customer->update([
            'marketing_blocked_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        $privacyLedger->record(
            customer: $customer,
            event: 'arco.opposition.marketing_blocked',
            actor: $request->user(),
            metadata: ['scope' => 'marketing']
        );

        return back()->with('success', 'Oposición registrada: marketing bloqueado.');
    }

    public function acceptPrivacy(Request $request, Customer $customer, CustomerPrivacyLedger $privacyLedger): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE), 403);
        abort_if($customer->isInCustody(), 409, 'Este cliente ya esta bajo Custodia.');

        $validated = $request->validate([
            'source' => ['nullable', 'string', 'max:60'],
        ]);

        $customer->update([
            'privacy_accepted_at' => now(),
            'privacy_version' => config('privacy.customer_notice_version', 'everden-mx-v1'),
            'privacy_acceptance_source' => $validated['source'] ?? 'tenant',
            'updated_by' => $request->user()->id,
        ]);

        $privacyLedger->record(
            customer: $customer,
            event: 'privacy.accepted',
            actor: $request->user(),
            metadata: ['source' => $validated['source'] ?? 'tenant']
        );

        return back()->with('success', 'Aceptación de privacidad registrada.');
    }

    public function custodyCancel(Request $request, Customer $customer, CustomerCustodyService $custodyService): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE), 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:8', 'max:500'],
        ]);

        $custodyService->anonymize($customer, $request->user(), $validated['reason']);

        return back()->with('success', 'Cancelación ARCO aplicada: datos personales bajo Custodia.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedCustomerData(Request $request, bool $includePrivacy = true): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:40'],
            'tax_id' => ['nullable', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];

        if ($includePrivacy) {
            $rules['privacy_accepted'] = ['required', 'accepted'];
            $rules['sale_id'] = ['nullable', 'integer', Rule::exists('sales', 'id')];
        }

        return $request->validate($rules);
    }
}
