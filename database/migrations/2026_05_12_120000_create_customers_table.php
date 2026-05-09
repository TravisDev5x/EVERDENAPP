<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('anonymized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 160);
            $table->string('email', 160)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('tax_id', 32)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('privacy_accepted_at')->nullable();
            $table->string('privacy_version', 40)->nullable();
            $table->string('privacy_acceptance_source', 60)->nullable();
            $table->timestamp('marketing_blocked_at')->nullable();
            $table->timestamp('anonymized_at')->nullable();
            $table->text('custody_reason')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'name']);
            $table->index(['tenant_id', 'email']);
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'privacy_accepted_at']);
            $table->index(['tenant_id', 'marketing_blocked_at']);
            $table->index(['tenant_id', 'anonymized_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
