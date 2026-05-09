<?php

namespace App\Jobs;

use App\Models\PrintJob;
use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Escribe JSON en storage/app/print-outbox y opcionalmente notifica a un agente HTTP local (ESC/POS).
 */
class ProcessSalePrintJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public int $printJobId
    ) {}

    public function handle(): void
    {
        $job = PrintJob::query()->find($this->printJobId);
        if ($job === null || $job->status !== PrintJob::STATUS_PENDING) {
            return;
        }

        $job->update(['status' => PrintJob::STATUS_PROCESSING]);

        try {
            $sale = Sale::query()
                ->with(['items' => fn ($q) => $q->orderBy('id')])
                ->findOrFail($job->sale_id);

            $payload = $this->buildPayload($job->id, $sale);

            Storage::disk('local')->put(
                'print-outbox/'.$job->id.'.json',
                json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)
            );

            $this->notifyAgentHttp($payload);

            $job->update([
                'status' => PrintJob::STATUS_COMPLETED,
                'error_message' => null,
            ]);
        } catch (\Throwable $e) {
            $job->update([
                'status' => PrintJob::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(int $printJobId, Sale $sale): array
    {
        return [
            'print_job_id' => $printJobId,
            'sale_id' => $sale->id,
            'status' => $sale->status,
            'payment_status' => $sale->payment_status,
            'subtotal' => $sale->subtotal,
            'tax_total' => $sale->tax_total,
            'total' => $sale->total,
            'items' => $sale->items->map(fn ($i) => [
                'sku' => $i->product_sku,
                'name' => $i->product_name,
                'quantity' => $i->quantity,
                'line_total' => $i->line_total,
            ])->values()->all(),
            'queued_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function notifyAgentHttp(array $payload): void
    {
        if (! config('printing.notify_agent')) {
            return;
        }

        $url = config('printing.agent_url');
        if (! is_string($url) || $url === '') {
            return;
        }

        try {
            $pending = Http::timeout((int) config('printing.agent_timeout', 5))
                ->acceptJson()
                ->asJson();

            $secret = config('printing.agent_secret');
            if (is_string($secret) && $secret !== '') {
                $pending = $pending->withToken($secret);
            }

            $pending->post($url, $payload)->throw();
        } catch (\Throwable $e) {
            Log::warning('Impresión: agente HTTP no respondió', [
                'url' => $url,
                'message' => $e->getMessage(),
            ]);

            if (! config('printing.agent_fail_soft', true)) {
                throw $e;
            }
        }
    }
}
