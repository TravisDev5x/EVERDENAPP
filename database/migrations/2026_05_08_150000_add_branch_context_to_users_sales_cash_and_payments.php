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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->nullOnDelete();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->nullOnDelete();
            $table->index(['tenant_id', 'branch_id', 'status']);
        });

        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->nullOnDelete();
            $table->index(['tenant_id', 'branch_id', 'status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->nullOnDelete();
            $table->index(['tenant_id', 'branch_id', 'method']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });

        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });
    }
};
