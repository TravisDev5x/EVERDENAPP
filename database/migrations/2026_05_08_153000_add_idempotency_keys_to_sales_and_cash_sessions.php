<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('confirm_idempotency_key', 120)->nullable()->after('paid_at');
            $table->unique(
                ['tenant_id', 'branch_id', 'confirm_idempotency_key'],
                'sales_confirm_idempotency_unique'
            );
        });

        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->string('close_idempotency_key', 120)->nullable()->after('closed_at');
            $table->unique(
                ['tenant_id', 'branch_id', 'close_idempotency_key'],
                'cash_close_idempotency_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->dropUnique('cash_close_idempotency_unique');
            $table->dropColumn('close_idempotency_key');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique('sales_confirm_idempotency_unique');
            $table->dropColumn('confirm_idempotency_key');
        });
    }
};
