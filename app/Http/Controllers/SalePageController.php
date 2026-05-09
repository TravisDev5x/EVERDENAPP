<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use App\Services\SalePrintEnqueueService;
use App\Support\Permissions;
use Inertia\Inertia;
use Inertia\Response;

class SalePageController extends Controller
{
    public function show(Request $request, ?Sale $sale = null): Response
    {
        $this->authorize('viewAny', Sale::class);

        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'price', 'tax_rate', 'unit', 'category_id']);

        $categories = ProductCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'color']);

        $branchId = app('current_branch_id');
        $saleData = null;

        if ($sale) {
            $this->authorize('view', $sale);
            abort_unless((int) $sale->branch_id === (int) $branchId, 403);
            $saleData = $sale->load('items', 'payments', 'customer:id,name,email,phone,privacy_accepted_at,privacy_version,marketing_blocked_at,anonymized_at');
        }

        $cashRegisters = CashRegister::query()
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'code']);

        $cashSession = CashSession::query()
            ->with(['cashRegister:id,name,code'])
            ->where('user_id', $request->user()->id)
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->latest('id')
            ->first();

        $branches = Branch::query()
            ->where('is_active', true)
            ->orderByDesc('is_main')
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'state', 'is_main']);

        return Inertia::render('Sales/Index', [
            'products' => $products,
            'categories' => $categories,
            'sale' => $saleData,
            'cashSession' => $cashSession,
            'cashRegisters' => $cashRegisters,
            'branches' => $branches,
            'activeBranchId' => $branchId,
            'customerDisplayUrl' => $saleData !== null
                ? route('sales.customer-display', ['sale' => $saleData->id])
                : null,
            'ticketPrintUrl' => $saleData !== null
                ? route('sales.ticket', ['sale' => $saleData->id])
                : null,
            'ticketDigitalUrl' => $saleData !== null
                ? route('sales.ticket.digital', ['sale' => $saleData->id])
                : null,
            'printQueueUrl' => $saleData !== null
                ? route('sales.print-queue', ['sale' => $saleData->id])
                : null,
            'ui' => [
                'focus_open_cash' => $request->boolean('open_cash'),
            ],
            'store_vertical' => [
                'print_after_pay' => (bool) config('printing.auto_after_pay'),
                'queue_connection' => (string) config('queue.default'),
                'needs_queue_worker' => config('queue.default') !== 'sync',
                'notify_agent' => (bool) config('printing.notify_agent'),
                'agent_configured' => is_string(config('printing.agent_url'))
                    && config('printing.agent_url') !== '',
                'daily_report_url' => $request->user()?->hasPermission(Permissions::REPORTS_VIEW)
                    ? route('reports.daily', ['date' => now()->toDateString()])
                    : null,
            ],
        ]);
    }

    public function customerDisplay(Request $request, Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $branchId = app('current_branch_id');
        abort_unless((int) $sale->branch_id === (int) $branchId, 403);

        $sale->loadMissing(['branch:id,name']);

        $tenant = $request->user()?->tenant;

        return Inertia::render('Sales/CustomerDisplay', [
            'sale' => $this->salePayloadForDisplay($sale),
            'storeTitle' => $tenant?->trade_name ?: $tenant?->name ?? 'Ticket',
            'branchName' => $sale->branch?->name ?? '',
            'displayStateUrl' => route('sales.display-state', ['sale' => $sale->id]),
            'displayPollIntervalMs' => 2500,
        ]);
    }

    public function displayState(Request $request, Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);

        $branchId = app('current_branch_id');
        abort_unless((int) $sale->branch_id === (int) $branchId, 403);

        return response()->json([
            'sale' => $this->salePayloadForDisplay($sale),
            'polled_at' => now()->toIso8601String(),
        ]);
    }

    public function enqueuePrint(Request $request, Sale $sale): RedirectResponse
    {
        $this->authorize('view', $sale);

        $branchId = app('current_branch_id');
        abort_unless((int) $sale->branch_id === (int) $branchId, 403);

        app(SalePrintEnqueueService::class)->enqueue($sale, $request->user());

        return back()->with('success', 'Ticket encolado para impresión / agente.');
    }

    public function ticketPrint(Request $request, Sale $sale): View
    {
        $this->authorize('view', $sale);

        $branchId = app('current_branch_id');
        abort_unless((int) $sale->branch_id === (int) $branchId, 403);

        $sale->load([
            'items' => fn ($q) => $q->orderBy('id'),
            'branch:id,name,address,neighborhood,city,state,postal_code,phone,rfc',
            'tenant:id,name,trade_name',
            'payments:id,sale_id,method,amount,paid_at',
            'customer:id,name,tax_id',
        ]);

        return view('sales.ticket-print', [
            'sale' => $sale,
            'autoprint' => $request->boolean('autoprint'),
        ]);
    }

    public function ticketDigital(Request $request, Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $branchId = app('current_branch_id');
        abort_unless((int) $sale->branch_id === (int) $branchId, 403);

        $sale->load([
            'items' => fn ($q) => $q->orderBy('id'),
            'branch:id,name,address,neighborhood,city,state,postal_code,phone,rfc',
            'tenant:id,name,trade_name',
            'payments:id,sale_id,method,amount,paid_at',
            'customer:id,name,tax_id,email,phone',
        ]);

        return Inertia::render('Sales/ReceiptPreview', [
            'receipt' => [
                'folio' => str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
                'issued_at' => ($sale->confirmed_at ?? $sale->created_at)?->toIso8601String(),
                'status' => $sale->status,
                'payment_status' => $sale->payment_status,
                'subtotal' => $sale->subtotal,
                'tax_total' => $sale->tax_total,
                'total' => $sale->total,
                'tenant' => [
                    'trade_name' => $sale->tenant?->trade_name ?: $sale->tenant?->name,
                    'legal_name' => $sale->tenant?->name,
                ],
                'branch' => $sale->branch ? [
                    'name' => $sale->branch->name,
                    'address' => $sale->branch->address,
                    'neighborhood' => $sale->branch->neighborhood,
                    'city' => $sale->branch->city,
                    'state' => $sale->branch->state,
                    'postal_code' => $sale->branch->postal_code,
                    'phone' => $sale->branch->phone,
                    'rfc' => $sale->branch->rfc,
                ] : null,
                'customer' => $sale->customer ? [
                    'name' => $sale->customer->name,
                    'tax_id' => $sale->customer->tax_id,
                    'email' => $sale->customer->email,
                    'phone' => $sale->customer->phone,
                ] : null,
                'items' => $sale->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'product_sku' => $item->product_sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_rate' => $item->tax_rate,
                    'line_subtotal' => $item->line_subtotal,
                    'line_tax_total' => $item->line_tax_total,
                    'line_total' => $item->line_total,
                ])->values()->all(),
                'payments' => $sale->payments->map(fn ($payment): array => [
                    'method' => $payment->method,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                ])->values()->all(),
            ],
            'thermalUrl' => route('sales.ticket', ['sale' => $sale->id]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function salePayloadForDisplay(Sale $sale): array
    {
        $sale->load([
            'items' => fn ($q) => $q->orderBy('id'),
            'branch:id,name',
        ]);

        return [
            'id' => $sale->id,
            'status' => $sale->status,
            'payment_status' => $sale->payment_status,
            'subtotal' => $sale->subtotal,
            'tax_total' => $sale->tax_total,
            'total' => $sale->total,
            'items' => $sale->items->map(fn ($item): array => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'product_sku' => $item->product_sku,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ])->values()->all(),
        ];
    }
}
