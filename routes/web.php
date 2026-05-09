<?php

use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductCategoryPageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductPageController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryPageController;
use App\Http\Controllers\InventoryTransferController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ActiveBranchController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchPageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CashRegisterPageController;
use App\Http\Controllers\CashSessionController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerCustodyPageController;
use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\FinancePageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SalePageController;
use App\Http\Controllers\TeamRoleController;
use App\Http\Controllers\TeamRolePageController;
use App\Http\Controllers\TeamUserController;
use App\Http\Controllers\TeamUserPageController;
use App\Http\Controllers\AccountSuspendedController;
use App\Http\Controllers\LegalNoticeController;
use App\Http\Controllers\Platform\TenantDirectoryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

require __DIR__.'/auth.php';

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/privacidad', [LegalNoticeController::class, 'privacy'])->name('legal.privacy');
Route::get('/terminos', [LegalNoticeController::class, 'terms'])->name('legal.terms');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'tenant'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/account/suspended', [AccountSuspendedController::class, 'show'])->name('account.suspended');
});

Route::middleware(['auth', 'platform'])->prefix('platform')->name('platform.')->group(function (): void {
    Route::get('/tenants', [TenantDirectoryController::class, 'index'])->name('tenants.index');
    Route::patch('/tenants/{tenant}', [TenantDirectoryController::class, 'updateMetadata'])->name('tenants.update');
    Route::patch('/tenants/{tenant}/plan', [TenantDirectoryController::class, 'updatePlan'])->name('tenants.plan.update');
    Route::patch('/tenants/{tenant}/suspend', [TenantDirectoryController::class, 'suspend'])->name('tenants.suspend');
    Route::patch('/tenants/{tenant}/activate', [TenantDirectoryController::class, 'activate'])->name('tenants.activate');
});

Route::middleware(['auth', 'tenant'])->group(function (): void {
    Route::get('/catalog/products', [ProductPageController::class, 'index'])->name('products.page');
    Route::get('/catalog/categories', [ProductCategoryPageController::class, 'index'])
        ->name('product-categories.page');
    Route::get('/inventory', [InventoryPageController::class, 'index'])->name('inventory.page');
    Route::get('/branches', [BranchPageController::class, 'index'])->name('branches.page');
    Route::get('/cash-registers', [CashRegisterPageController::class, 'index'])->name('cash-registers.page');
    Route::post('/cash-registers', [CashRegisterController::class, 'store'])->name('cash-registers.store');
    Route::patch('/cash-registers/{cashRegister}', [CashRegisterController::class, 'update'])->name('cash-registers.update');
    Route::delete('/cash-registers/{cashRegister}', [CashRegisterController::class, 'destroy'])->name('cash-registers.destroy');
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::get('/product-categories', [ProductCategoryController::class, 'index'])
        ->name('product-categories.index');
    Route::post('/product-categories', [ProductCategoryController::class, 'store'])
        ->name('product-categories.store');
    Route::patch('/product-categories/{product_category}', [ProductCategoryController::class, 'update'])
        ->name('product-categories.update');
    Route::delete('/product-categories/{product_category}', [ProductCategoryController::class, 'destroy'])
        ->name('product-categories.destroy');
    Route::post('/inventory/products/{product}/adjust', [InventoryController::class, 'adjustStock'])->name('inventory.adjust');
    Route::patch('/inventory/products/{product}/policy', [InventoryController::class, 'updatePolicy'])->name('inventory.policy.update');
    Route::get('/inventory/transfers', [InventoryTransferController::class, 'index'])
        ->name('inventory.transfers.index');
    Route::post('/inventory/transfers', [InventoryTransferController::class, 'store'])
        ->name('inventory.transfers.store');
    Route::post('/inventory/alerts/{alert}/acknowledge', [InventoryController::class, 'acknowledgeAlert'])->name('inventory.alerts.ack');
    Route::post('/branches', [BranchController::class, 'store'])->name('branches.store');
    Route::patch('/branches/{branch}', [BranchController::class, 'update'])->name('branches.update');

    Route::get('/custodia/clientes', [CustomerCustodyPageController::class, 'index'])->name('customers.custody.page');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::patch('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::get('/customers/{customer}/export', [CustomerController::class, 'export'])->name('customers.export');
    Route::post('/customers/{customer}/privacy-consent', [CustomerController::class, 'acceptPrivacy'])->name('customers.privacy.accept');
    Route::patch('/customers/{customer}/marketing-opposition', [CustomerController::class, 'opposeMarketing'])->name('customers.marketing.oppose');
    Route::post('/customers/{customer}/custody-cancel', [CustomerController::class, 'custodyCancel'])->name('customers.custody.cancel');

    Route::get('/sales/{sale}/pantalla-cliente', [SalePageController::class, 'customerDisplay'])->name('sales.customer-display');
    Route::get('/sales/{sale}/display-state', [SalePageController::class, 'displayState'])->name('sales.display-state');
    Route::post('/sales/{sale}/print-queue', [SalePageController::class, 'enqueuePrint'])->name('sales.print-queue');
    Route::get('/sales/{sale}/ticket', [SalePageController::class, 'ticketPrint'])->name('sales.ticket');
    Route::get('/sales/{sale}/ticket/digital', [SalePageController::class, 'ticketDigital'])->name('sales.ticket.digital');
    Route::get('/sales/{sale?}', [SalePageController::class, 'show'])->name('sales.page');
    Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::post('/sales/{sale}/items', [SaleController::class, 'addItem'])->name('sales.items.store');
    Route::delete('/sales/{sale}/items/{item}', [SaleController::class, 'removeItem'])->name('sales.items.destroy');
    Route::post('/sales/{sale}/confirm', [SaleController::class, 'confirm'])->name('sales.confirm');
    Route::post('/sales/{sale}/pay-cash', [PaymentController::class, 'payCash'])->name('sales.pay-cash');

    Route::post('/cash/open', [CashSessionController::class, 'open'])->name('cash.open');
    Route::post('/cash/{cashSession}/close', [CashSessionController::class, 'close'])->name('cash.close');
    Route::get('/reports/daily', [DailyReportController::class, 'index'])->name('reports.daily');
    Route::post('/reports/daily/rebuild', [DailyReportController::class, 'rebuild'])->name('reports.daily.rebuild');
    Route::get('/reports/daily/status', [DailyReportController::class, 'status'])->name('reports.daily.status');
    Route::get('/finance', [FinancePageController::class, 'index'])->name('finance.page');
    Route::get('/team/users', [TeamUserPageController::class, 'index'])->name('team.users.page');
    Route::post('/team/users', [TeamUserController::class, 'store'])->name('team.users.store');
    Route::patch('/team/users/{user}', [TeamUserController::class, 'update'])->name('team.users.update');
    Route::get('/team/roles', [TeamRolePageController::class, 'index'])->name('team.roles.page');
    Route::post('/team/roles', [TeamRoleController::class, 'store'])->name('team.roles.store');
    Route::patch('/team/roles/{role}', [TeamRoleController::class, 'update'])->name('team.roles.update');
    Route::delete('/team/roles/{role}', [TeamRoleController::class, 'destroy'])->name('team.roles.destroy');
    Route::post('/team/roles/{role}/permissions', [TeamRoleController::class, 'syncPermissions'])->name('team.roles.permissions.sync');
    Route::patch('/active-branch/{branch}', [ActiveBranchController::class, 'update'])->name('active-branch.update');
});
