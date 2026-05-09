<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('plan_slug', 40)->default('standard')->after('slug');
            $table->unsignedInteger('max_users')->nullable()->after('plan_slug');
            $table->unsignedInteger('max_branches')->nullable()->after('max_users');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn(['plan_slug', 'max_users', 'max_branches']);
        });
    }
};
