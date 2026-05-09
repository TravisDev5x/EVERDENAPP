<?php

namespace Tests\Feature;

use App\Jobs\ProcessSalePrintJob;
use App\Models\Branch;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PrintAgentHttpNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_posts_payload_to_agent_when_notify_enabled(): void
    {
        Storage::fake('local');

        Http::fake([
            'agent.local/*' => Http::response(['ok' => true], 200),
        ]);

        Config::set('printing.notify_agent', true);
        Config::set('printing.agent_url', 'http://agent.local/print');
        Config::set('printing.agent_secret', 'test-secret');
        Config::set('printing.agent_fail_soft', true);

        $tenant = Tenant::factory()->create();
        $branch = Branch::factory()->create([
            'tenant_id' => $tenant->id,
            'is_main' => true,
            'is_active' => true,
        ]);
        $user = User::factory()->forRoleSlug('cajero')->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'sku' => 'X1',
            'price' => 10,
            'tax_rate' => 0,
        ]);

        $sale = Sale::query()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'subtotal' => 10,
            'tax_total' => 0,
            'total' => 10,
        ]);

        $sale->items()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => 10,
            'tax_rate' => 0,
            'line_subtotal' => 10,
            'line_tax_total' => 0,
            'line_total' => 10,
        ]);

        $pj = PrintJob::query()->create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale->id,
            'requested_by_user_id' => $user->id,
            'status' => PrintJob::STATUS_PENDING,
        ]);

        $job = new ProcessSalePrintJob($pj->id);
        $job->handle();

        $pj->refresh();
        $this->assertSame(PrintJob::STATUS_COMPLETED, $pj->status);

        Storage::disk('local')->assertExists('print-outbox/'.$pj->id.'.json');

        Http::assertSent(function ($request) use ($pj, $sale): bool {
            return $request->url() === 'http://agent.local/print'
                && $request->hasHeader('Authorization', 'Bearer test-secret')
                && $request['sale_id'] === $sale->id
                && $request['print_job_id'] === $pj->id;
        });
    }
}
