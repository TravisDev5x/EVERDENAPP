<?php

namespace App\Jobs;

use App\Services\DailyReportBuilder;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class GenerateDailyReportJob implements ShouldQueue
{
    use Queueable;

    public string $queue = 'reports';

    public function __construct(
        public int $tenantId,
        public int $branchId,
        public string $dateYmd,
    ) {}

    public function handle(DailyReportBuilder $builder): void
    {
        $date = Carbon::parse($this->dateYmd)->startOfDay();
        $payload = $builder->build($this->branchId, $date);

        $key = DailyReportBuilder::cacheKey($this->tenantId, $this->branchId, $this->dateYmd);
        Cache::put($key, $payload, now()->addMinutes(15));
    }
}
