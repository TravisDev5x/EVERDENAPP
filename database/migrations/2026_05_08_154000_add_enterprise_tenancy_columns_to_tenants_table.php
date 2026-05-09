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
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('tenancy_mode', 20)->default('shared')->after('timezone');
            $table->string('db_connection', 30)->nullable()->after('tenancy_mode');
            $table->string('db_database', 120)->nullable()->after('db_connection');
            $table->string('db_host', 120)->nullable()->after('db_database');
            $table->unsignedSmallInteger('db_port')->nullable()->after('db_host');
            $table->boolean('enterprise_enabled')->default(false)->after('db_port');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'tenancy_mode',
                'db_connection',
                'db_database',
                'db_host',
                'db_port',
                'enterprise_enabled',
            ]);
        });
    }
};
