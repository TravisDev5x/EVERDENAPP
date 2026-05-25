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
            $table->string('phone', 20)->nullable()->after('avatar');
            $table->string('whatsapp', 20)->nullable()->after('phone');
            $table->string('employee_number', 20)->nullable()->after('whatsapp');
            $table->date('birth_date')->nullable()->after('employee_number');
            $table->date('hire_date')->nullable()->after('birth_date');
            $table->string('cash_pin')->nullable()->after('hire_date');
            $table->timestamp('pin_set_at')->nullable()->after('cash_pin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'phone',
                'whatsapp',
                'employee_number',
                'birth_date',
                'hire_date',
                'cash_pin',
                'pin_set_at',
            ]);
        });
    }
};
