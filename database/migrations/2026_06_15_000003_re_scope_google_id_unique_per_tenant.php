<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['google_id']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->unique(['tenant_id', 'google_id'], 'users_tenant_google_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('users_tenant_google_unique');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('google_id');
        });
    }
};
