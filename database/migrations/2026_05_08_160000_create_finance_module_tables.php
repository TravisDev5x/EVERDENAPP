<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 120);
            $table->string('type', 30);
            $table->boolean('is_system')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'type']);
        });

        Schema::create('finance_journal_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cash_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 60);
            $table->string('idempotency_key', 140)->nullable();
            $table->string('source_type', 140)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->timestamp('occurred_at');
            $table->string('description', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id', 'occurred_at']);
            $table->unique(['tenant_id', 'idempotency_key']);
        });

        Schema::create('finance_journal_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')
                ->constrained('finance_journal_entries')
                ->cascadeOnDelete();
            $table->foreignId('account_id')
                ->constrained('finance_accounts')
                ->restrictOnDelete();
            $table->bigInteger('debit_cents')->default(0);
            $table->bigInteger('credit_cents')->default(0);
            $table->string('memo', 255)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'journal_entry_id']);
            $table->index(['tenant_id', 'account_id']);
        });

        Schema::create('cash_count_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 10);
            $table->integer('denomination_value_cents');
            $table->integer('quantity');
            $table->integer('line_total_cents');
            $table->timestamps();

            $table->unique(['cash_session_id', 'kind', 'denomination_value_cents']);
            $table->index(['tenant_id', 'cash_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_count_lines');
        Schema::dropIfExists('finance_journal_lines');
        Schema::dropIfExists('finance_journal_entries');
        Schema::dropIfExists('finance_accounts');
    }
};
