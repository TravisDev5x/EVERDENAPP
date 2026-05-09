<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('code', 40)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'code']);
            $table->index(['tenant_id', 'branch_id']);
        });

        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->foreignId('cash_register_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('cash_registers')
                ->nullOnDelete();
        });

        $branches = DB::table('branches')->select(['id', 'tenant_id'])->orderBy('id')->get();

        foreach ($branches as $branch) {
            $registerId = DB::table('cash_registers')->insertGetId([
                'tenant_id' => $branch->tenant_id,
                'branch_id' => $branch->id,
                'name' => 'Caja 1',
                'code' => 'caja-1',
                'is_active' => true,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('cash_sessions')
                ->where('branch_id', $branch->id)
                ->whereNull('cash_register_id')
                ->update(['cash_register_id' => $registerId]);
        }
    }

    public function down(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('cash_register_id');
        });

        Schema::dropIfExists('cash_registers');
    }
};
