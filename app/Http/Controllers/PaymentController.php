<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Sale;
use App\Services\AuditLogger;
use App\Services\CashSessionService;
use App\Services\FinanceService;
use App\Services\SalePrintEnqueueService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function payCash(
        Request $request,
        Sale $sale,
        CashSessionService $cashSessionService,
        AuditLogger $auditLogger,
        FinanceService $financeService
    ): RedirectResponse {
        $idempotencyKey = (string) $request->input('idempotency_key', '');
        if ($idempotencyKey !== '') {
            $alreadyProcessed = Payment::query()
                ->where('sale_id', $sale->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();
            if ($alreadyProcessed) {
                return back()->with('success', 'Cobro previamente aplicado (idempotente).');
            }
        }

        $this->authorize('pay', [Payment::class, $sale]);

        $branchId = app('current_branch_id');
        if ((int) $sale->branch_id !== (int) $branchId) {
            return back()->withErrors([
                'payment' => 'La venta no pertenece a la sucursal activa.',
            ]);
        }

        $cashSession = $cashSessionService->currentOpenFor($request->user(), $branchId);
        if (! $cashSession) {
            return back()->withErrors(['payment' => 'Debes abrir caja antes de cobrar.']);
        }

        $amount = (float) $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'idempotency_key' => ['required', 'string', 'max:120'],
        ])['amount'];
        $idempotencyKey = (string) $request->input('idempotency_key');

        $amountCents = Money::decimalToCents((string) $amount);
        $saleTotalCents = Money::decimalToCents((string) $sale->total);
        if ($amountCents !== $saleTotalCents) {
            return back()->withErrors([
                'payment' => 'El monto debe coincidir exactamente con el total de la venta.',
            ]);
        }

        $payment = null;
        DB::transaction(function () use (
            $sale,
            $cashSession,
            $request,
            $branchId,
            $idempotencyKey,
            $amountCents,
            &$payment,
            $financeService
        ): void {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);
            if ($sale->payment_status === 'paid') {
                abort(409, 'La venta ya fue pagada.');
            }
            $cashSession = $cashSession->newQuery()->lockForUpdate()->findOrFail($cashSession->id);

            $payment = Payment::query()->create([
                'branch_id' => $branchId,
                'sale_id' => $sale->id,
                'cash_session_id' => $cashSession->id,
                'user_id' => $request->user()->id,
                'method' => 'cash',
                'idempotency_key' => $idempotencyKey,
                'amount' => Money::centsToDecimal($amountCents),
                'status' => 'applied',
                'paid_at' => now(),
            ]);

            $currentCashCents = Money::decimalToCents((string) $cashSession->cash_sales_total);
            $cashSession->update([
                'cash_sales_total' => Money::centsToDecimal($currentCashCents + $amountCents),
            ]);

            $sale->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
            ]);

            $financeService->recordCashPayment($sale, $payment, $request->user());
        });

        $auditLogger->log(
            event: 'payment.cash.applied',
            entityType: Sale::class,
            entityId: $sale->id,
            actor: $request->user(),
            metadata: [
                'amount' => $amount,
                'cash_session_id' => $cashSession->id,
                'branch_id' => $branchId,
                'idempotency_key' => $idempotencyKey,
            ]
        );

        $sale->refresh();

        $successMessage = 'Cobro en efectivo aplicado.';
        if (config('printing.auto_after_pay')) {
            app(SalePrintEnqueueService::class)->enqueue($sale, $request->user());
            $successMessage .= ' Ticket encolado para impresión.';
        }

        return back()->with('success', $successMessage);
    }
}
