<?php

use App\Http\Controllers\InvitationPublicController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\LegalNoticeController;
use App\Models\Plan;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])
    ->name('cashier.webhook');

Route::get('/', function () {
    $plans = collect([]);

    if (Schema::hasTable('plans')) {
        $plans = Plan::where('is_active', true)
            ->orderBy('price_mxn')
            ->get([
                'id', 'name', 'slug', 'price_mxn',
                'max_users', 'max_products', 'max_branches',
                'has_offline_mode', 'has_advanced_reports', 'has_api_access',
            ]);
    }

    return Inertia::render('Welcome', [
        'canLogin'    => Route::has('login'),
        'canRegister' => Route::has('register'),
        'plans'       => $plans,
    ]);
});

Route::get('/privacidad', [LegalNoticeController::class, 'privacy'])->name('legal.privacy');
Route::get('/terminos', [LegalNoticeController::class, 'terms'])->name('legal.terms');

Route::get('/invitacion/{token}', [InvitationPublicController::class, 'show'])
    ->name('invitations.accept');
Route::post('/invitacion/{token}/aceptar', [InvitationPublicController::class, 'accept'])
    ->name('invitations.accept.store')
    ->middleware('throttle:5,1');
Route::post('/invitacion/{token}/rechazar', [InvitationPublicController::class, 'reject'])
    ->name('invitations.reject')
    ->middleware('throttle:5,1');
