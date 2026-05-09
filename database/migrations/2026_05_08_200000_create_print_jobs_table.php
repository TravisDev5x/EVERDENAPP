<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 32)->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['sale_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
