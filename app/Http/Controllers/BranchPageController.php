<?php

namespace App\Http\Controllers;

use App\Enums\BranchSiteKind;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Branch::class);

        $tenantId = $request->user()?->tenant_id;

        return Inertia::render('Branches/Index', [
            'branches' => Branch::query()
                ->with('parentBranch:id,name')
                ->orderByDesc('is_main')
                ->orderBy('name')
                ->paginate(15)
                ->withQueryString(),
            'canManage' => $request->user()?->hasPermission(\App\Support\Permissions::BRANCHES_MANAGE) ?? false,
            'tenant' => $request->user()?->tenant?->only(['name', 'country_code', 'currency_code', 'timezone']),
            'branchSiteKindOptions' => collect(BranchSiteKind::cases())->map(fn (BranchSiteKind $kind): array => [
                'value' => $kind->value,
                'label' => $kind->label(),
            ])->values()->all(),
            'parentBranchOptions' => Branch::query()
                ->where('tenant_id', $tenantId)
                ->whereNull('parent_branch_id')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
