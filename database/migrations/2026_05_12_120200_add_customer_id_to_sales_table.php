<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->foreignId('customer_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();

            $table->index(['tenant_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'customer_id']);
            $table->dropConstrainedForeignId('customer_id');
        });
    }
};
