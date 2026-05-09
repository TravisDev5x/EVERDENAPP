<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_platform_operator')->default(false)->after('remember_token');
        });

        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('trade_name')->nullable()->after('name');
            $table->timestamp('suspended_at')->nullable()->after('is_active');
            $table->string('suspension_reason', 500)->nullable()->after('suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn(['trade_name', 'suspended_at', 'suspension_reason']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('is_platform_operator');
        });
    }
};
