<?php

namespace App\Http\Middleware;

use App\Domain\Cashier\BranchCashRegisterBootstrap;
use App\Models\Branch;
use App\Models\Tenant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Tenant context is required.');
        }

        if (! $user->tenant_id) {
            if ($user->is_platform_operator) {
                return redirect()->route('platform.tenants.index');
            }

            abort(403, 'Tenant context is required.');
        }

        if (app()->bound('currentTenant')) {
            $hostTenant = app('currentTenant');
            if ($hostTenant instanceof Tenant
                && (int) $user->tenant_id !== (int) $hostTenant->id) {
                abort(403, 'Este usuario no pertenece al negocio de este enlace.');
            }
        }

        $tenant = Tenant::query()->find($user->tenant_id);

        if (! $tenant || ! $tenant->is_active) {
            return redirect()->route('account.suspended');
        }

        if ($user->suspended_at !== null) {
            return redirect()->route('account.suspended');
        }

        // BelongsToTenant resuelve el tenant vía TenantContext o current_tenant_id. Sin esto,
        // el global scope devuelve 0 filas y crear Branch dispara LogicException antes de setear contexto.
        app()->instance('current_tenant_id', (int) $user->tenant_id);

        $activeBranch = $user->branch;

        if (! $activeBranch || $activeBranch->tenant_id !== $user->tenant_id || ! $activeBranch->is_active) {
            $activeBranch = Branch::query()
                ->where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->orderByDesc('is_main')
                ->orderBy('id')
                ->first();

            if (! $activeBranch) {
                $activeBranch = Branch::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'name' => 'Sucursal Matriz',
                    'is_main' => true,
                    'is_active' => true,
                ]);
            }

            $user->forceFill(['branch_id' => $activeBranch->id])->save();
        }

        app(BranchCashRegisterBootstrap::class)->ensureDefaults($activeBranch);

        Log::withContext([
            'tenant_id' => (string) $user->tenant_id,
            'branch_id' => (string) $activeBranch->id,
            'user_id' => (string) $user->id,
        ]);

        /** @var TenantContext $tenantContext */
        $tenantContext = app(TenantContext::class);
        $tenantContext->set((int) $user->tenant_id, (int) $activeBranch->id);

        app()->instance('current_tenant_id', $user->tenant_id);
        app()->instance('current_branch_id', $activeBranch->id);

        return $next($request);
    }
}
