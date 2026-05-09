<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('store:vertical-check', function (): int {
    $this->info('Comprobación vertical tienda (ventas · cola · impresión)');

    $queue = (string) config('queue.default');
    $this->line("Cola (QUEUE_CONNECTION): {$queue}");
    if ($queue !== 'sync' && ! Schema::hasTable('jobs')) {
        $this->warn('  Tabla «jobs» no existe. Ejecute migraciones: php artisan migrate');
    } elseif ($queue !== 'sync') {
        $this->info('  Tabla «jobs» presente.');
    }

    $this->line('Impresión automática tras cobro: '.(config('printing.auto_after_pay') ? 'Sí' : 'No (PRINT_AFTER_PAY)'));
    $this->line('Notificar agente HTTP: '.(config('printing.notify_agent') ? 'Sí' : 'No (PRINT_NOTIFY_AGENT)'));

    $url = config('printing.agent_url');
    if (is_string($url) && $url !== '') {
        $this->line("PRINT_AGENT_URL: {$url}");
        if (config('printing.notify_agent')) {
            $health = preg_replace('#/print/?$#i', '/health', rtrim($url, '/'));
            if ($health !== $url) {
                try {
                    $r = Http::timeout(2)->get($health);
                    $ok = $r->successful() && str_contains($r->body(), 'ok');
                    $this->line('  Health GET '.($ok ? 'OK' : 'fallo')." ({$health})");
                } catch (\Throwable $e) {
                    $this->warn('  Agente no responde: '.$e->getMessage());
                }
            }
        }
    } else {
        $this->warn('PRINT_AGENT_URL vacío: configure la URL del agente (p. ej. http://127.0.0.1:9911/print).');
    }

    $this->newLine();
    $this->comment('En Windows (Laragon) puede arrancar cola + agente: scripts\\start-store-stack.cmd');

    return 0;
})->purpose('Verifica cola, impresión y agente local para operación de tienda');
