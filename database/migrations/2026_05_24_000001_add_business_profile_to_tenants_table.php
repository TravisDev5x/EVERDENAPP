<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('business_type')->nullable()->after('trade_name');
            $table->string('phone', 20)->nullable()->after('business_type');
            $table->string('whatsapp', 20)->nullable()->after('phone');
            $table->string('contact_email')->nullable()->after('whatsapp');
            $table->string('website')->nullable()->after('contact_email');

            $table->string('street')->nullable()->after('website');
            $table->string('neighborhood')->nullable()->after('street');
            $table->string('city')->nullable()->after('neighborhood');
            $table->string('state')->nullable()->after('city');
            $table->string('zip_code', 10)->nullable()->after('state');

            $table->string('rfc', 13)->nullable()->after('zip_code');

            $table->string('ticket_footer')->nullable()->after('rfc');

            $table->string('logo_url')->nullable()->after('ticket_footer');

            $table->timestamp('profile_completed_at')->nullable()->after('logo_url');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'business_type',
                'phone',
                'whatsapp',
                'contact_email',
                'website',
                'street',
                'neighborhood',
                'city',
                'state',
                'zip_code',
                'rfc',
                'ticket_footer',
                'logo_url',
                'profile_completed_at',
            ]);
        });
    }
};
