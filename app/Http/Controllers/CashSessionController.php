<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Branch;
use App\Services\AuditLogger;
use App\Services\CashSessionService;
use App\Services\FinanceService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CashSessionController extends Controller
{
    public function open(
        Request $request,
        CashSessionService $cashSessionService,
        AuditLogger $auditLogger,
        FinanceService $financeService
    ): RedirectResponse {
        $this->authorize('open', CashSession::class);

        $branchId = app('current_branch_id');
        $branch = Branch::query()->findOrFail($branchId);

        $existing = $cashSessionService->currentOpenFor($request->user(), $branchId);
        if ($existing) {
            return back()->withErrors(['cash' => 'Ya tienes una caja abierta.']);
        }

        $registers = CashRegister::query()
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($registers->isEmpty()) {
            return back()->withErrors(['cash' => 'No hay cajas registradoras configuradas en esta sucursal.']);
        }

        $rules = [
            'opening_amount' => ['required', 'numeric', 'min:0'],
        ];

        if ($registers->count() > 1) {
            $rules['cash_register_id'] = [
                'required',
                'integer',
                Rule::exists('cash_registers', 'id')
                    ->where('branch_id', $branchId)
                    ->where('is_active', true),
            ];
        } else {
            $rules['cash_register_id'] = ['nullable', 'integer'];
        }

        $validated = $request->validate($rules);
        $openingAmount = (float) $validated['opening_amount'];

        $register = $registers->count() === 1
            ? $registers->first()
            : $registers->firstWhere('id', (int) $validated['cash_register_id']);

        if ($register === null) {
            return back()->withErrors(['cash_register_id' => 'Selecciona una caja válida.']);
        }

        $session = $cashSessionService->openFor($request->user(), $branch, $register, $openingAmount);
        $financeService->recordCashOpen($session, $request->user());

        $auditLogger->log(
            event: 'cash.opened',
            entityType: CashSession::class,
            entityId: $session->id,
            actor: $request->user(),
            metadata: [
                'opening_amount' => $session->opening_amount,
                'branch_id' => $session->branch_id,
                'cash_register_id' => $session->cash_register_id,
            ]
        );

        return back()->with('success', 'Caja abierta correctamente.');
    }

    public function close(
        Request $request,
        CashSession $cashSession,
        AuditLogger $auditLogger,
        FinanceService $financeService
    ): RedirectResponse {
        $idempotencyKey = (string) $request->input('idempotency_key', '');
        if ($idempotencyKey !== '') {
            $alreadyClosed = CashSession::query()
                ->where('id', $cashSession->id)
                ->where('close_idempotency_key', $idempotencyKey)
                ->where('status', 'closed')
                ->exists();
            if ($alreadyClosed) {
                return back()->with('success', 'Cierre previo aplicado (idempotente).');
            }
        }

        $this->authorize('close', $cashSession);
        if ((int) $cashSession->branch_id !== (int) app('current_branch_id')) {
            return back()->withErrors(['cash' => 'La caja no pertenece a la sucursal activa.']);
        }

        $validated = $request->validate([
            'closing_amount' => ['required', 'numeric', 'min:0'],
            'closing_note' => ['nullable', 'string', 'max:255'],
            'idempotency_key' => ['required', 'string', 'max:120'],
            'denominations' => ['nullable', 'array'],
            'denominations.*.kind' => ['required', 'string', 'in:bill,coin'],
            'denominations.*.value' => ['required', 'integer', 'min:1'],
            'denominations.*.quantity' => ['required', 'integer', 'min:0'],
        ]);
        $closingAmountCents = Money::decimalToCents((string) $validated['closing_amount']);
        $idempotencyKey = (string) $validated['idempotency_key'];
        /** @var array<int, array{kind:string,value:int,quantity:int}> $denominations */
        $denominations = $validated['denominations'] ?? [];

        $closingNote = $request->input('closing_note');
        $expectedClosingCents = Money::decimalToCents((string) $cashSession->opening_amount)
            + Money::decimalToCents((string) $cashSession->cash_sales_total);
        $closingDifferenceCents = $closingAmountCents - $expectedClosingCents;

        if ($closingDifferenceCents !== 0 && blank($closingNote)) {
            return back()->withErrors([
                'cash' => 'Debes indicar motivo cuando hay descuadre de caja.',
            ]);
        }

        DB::transaction(function () use (
            $cashSession,
            $denominations,
            $closingAmountCents,
            $expectedClosingCents,
            $closingDifferenceCents,
            $closingNote,
            $idempotencyKey,
            $request,
            $financeService
        ): void {
            $cashSession = CashSession::query()->lockForUpdate()->findOrFail($cashSession->id);
            if (! $cashSession->isOpen()) {
                abort(409, 'La caja ya fue cerrada.');
            }

            if ($denominations !== []) {
                $countLines = collect($denominations)
                    ->map(fn (array $line): array => [
                        'kind' => $line['kind'],
                        'denomination_value_cents' => (int) $line['value'],
                        'quantity' => (int) $line['quantity'],
                    ])
                    ->all();

                $countedTotalCents = $financeService->saveCashCountLines($cashSession, $countLines);
                if ($countedTotalCents !== $closingAmountCents) {
                    abort(422, 'El total contado por denominaciones no coincide con el cierre.');
                }
            }

            $cashSession->update([
                'status' => 'closed',
                'expected_closing_amount' => Money::centsToDecimal($expectedClosingCents),
                'closing_amount' => Money::centsToDecimal($closingAmountCents),
                'closing_difference' => Money::centsToDecimal($closingDifferenceCents),
                'closing_note' => $closingNote,
                'closed_at' => now(),
                'close_idempotency_key' => $idempotencyKey,
            ]);

            $financeService->recordCashCloseDifference($cashSession, $closingDifferenceCents, $request->user());
        });
        $cashSession->refresh();

        $auditLogger->log(
            event: 'cash.closed',
            entityType: CashSession::class,
            entityId: $cashSession->id,
            actor: $request->user(),
            metadata: [
                'closing_amount' => $cashSession->closing_amount,
                'cash_sales_total' => $cashSession->cash_sales_total,
                'expected_closing_amount' => $cashSession->expected_closing_amount,
                'closing_difference' => $cashSession->closing_difference,
                'closing_note' => $cashSession->closing_note,
                'denominations_count' => count($denominations),
                'idempotency_key' => $idempotencyKey,
            ]
        );

        return back()->with('success', 'Caja cerrada correctamente.');
    }
}
