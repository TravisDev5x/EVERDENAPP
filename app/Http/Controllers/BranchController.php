<?php

namespace App\Http\Controllers;

use App\Domain\Billing\TenantPlanService;
use App\Domain\Cashier\BranchCashRegisterBootstrap;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use App\Models\Tenant;
use App\Services\AuditLogger;
use App\Services\BranchStockBootstrap;
use Illuminate\Http\RedirectResponse;

class BranchController extends Controller
{
    public function store(
        StoreBranchRequest $request,
        AuditLogger $auditLogger,
        TenantPlanService $tenantPlanService,
        BranchCashRegisterBootstrap $cashRegisterBootstrap,
        BranchStockBootstrap $branchStockBootstrap,
    ): RedirectResponse {
        $tenant = Tenant::query()->findOrFail((int) $request->user()->tenant_id);
        $tenantPlanService->assertCanCreateBranch($tenant);

        $branch = Branch::create([
            ...$request->validated(),
            'is_active' => $request->validated('is_active', true),
        ]);

        $cashRegisterBootstrap->ensureDefaults($branch);
        $branchStockBootstrap->ensureStocksForBranch($branch);

        $auditLogger->log(
            event: 'branch.created',
            entityType: Branch::class,
            entityId: $branch->id,
            actor: $request->user(),
            metadata: ['name' => $branch->name]
        );

        return back()->with('success', 'Sucursal creada correctamente.');
    }

    public function update(
        UpdateBranchRequest $request,
        Branch $branch,
        AuditLogger $auditLogger
    ): RedirectResponse {
        $auditKeys = [
            'name', 'branch_site_kind', 'parent_branch_id', 'code', 'state', 'city', 'postal_code', 'address',
            'neighborhood', 'municipality', 'address_references', 'site_location_detail',
            'phone', 'rfc', 'is_active',
        ];
        $before = $branch->only($auditKeys);
        $branch->update($request->validated());

        $auditLogger->log(
            event: 'branch.updated',
            entityType: Branch::class,
            entityId: $branch->id,
            actor: $request->user(),
            metadata: [
                'before' => $before,
                'after' => $branch->fresh()->only($auditKeys),
            ]
        );

        return back()->with('success', 'Sucursal actualizada correctamente.');
    }
}
