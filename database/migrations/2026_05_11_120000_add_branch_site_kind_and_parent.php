<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->string('branch_site_kind', 32)->default('standalone')->after('name');
            $table->foreignId('parent_branch_id')
                ->nullable()
                ->after('branch_site_kind')
                ->constrained('branches')
                ->nullOnDelete();
            $table->string('site_location_detail', 500)->nullable()->after('address_references');

            $table->index(['tenant_id', 'branch_site_kind']);
            $table->index('parent_branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('parent_branch_id');
            $table->dropColumn(['branch_site_kind', 'site_location_detail']);
        });
    }
};
