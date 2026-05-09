<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->string('address', 500)->nullable()->change();
            $table->string('rfc', 13)->nullable()->after('phone');
            $table->string('neighborhood', 120)->nullable()->after('address');
            $table->string('municipality', 120)->nullable()->after('neighborhood');
            $table->text('address_references')->nullable()->after('municipality');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->dropColumn(['rfc', 'neighborhood', 'municipality', 'address_references']);
            $table->string('address', 255)->nullable()->change();
        });
    }
};
