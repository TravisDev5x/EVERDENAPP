<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashRegisterPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', CashRegister::class);

        $branchId = (int) app('current_branch_id');

        $registers = CashRegister::query()
            ->where('branch_id', $branchId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id',
                'branch_id',
                'name',
                'code',
                'is_active',
                'sort_order',
            ]);

        return Inertia::render('CashRegisters/Index', [
            'cashRegisters' => $registers,
            'activeBranchId' => $branchId,
            'canManage' => $request->user()?->hasPermission(Permissions::BRANCHES_MANAGE) ?? false,
        ]);
    }
}
