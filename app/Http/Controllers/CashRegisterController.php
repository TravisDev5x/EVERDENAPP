<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCashRegisterRequest;
use App\Http\Requests\UpdateCashRegisterRequest;
use App\Models\CashRegister;
use App\Models\CashSession;
use Illuminate\Http\RedirectResponse;

class CashRegisterController extends Controller
{
    public function store(StoreCashRegisterRequest $request): RedirectResponse
    {
        $branchId = (int) app('current_branch_id');

        CashRegister::create([
            ...$request->validated(),
            'branch_id' => $branchId,
        ]);

        return back()->with('success', 'Caja registradora creada.');
    }

    public function update(UpdateCashRegisterRequest $request, CashRegister $cashRegister): RedirectResponse
    {
        abort_unless((int) $cashRegister->branch_id === (int) app('current_branch_id'), 403);

        $cashRegister->update($request->validated());

        return back()->with('success', 'Caja actualizada.');
    }

    public function destroy(CashRegister $cashRegister): RedirectResponse
    {
        $this->authorize('delete', $cashRegister);

        abort_unless((int) $cashRegister->branch_id === (int) app('current_branch_id'), 403);

        $branchId = (int) $cashRegister->branch_id;

        $countForBranch = CashRegister::query()->where('branch_id', $branchId)->count();
        if ($countForBranch <= 1) {
            return back()->withErrors([
                'delete' => 'Debe existir al menos una caja por sucursal.',
            ]);
        }

        if (CashSession::query()
            ->where('cash_register_id', $cashRegister->id)
            ->where('status', 'open')
            ->exists()) {
            return back()->withErrors([
                'delete' => 'No puedes eliminar una caja con sesión abierta.',
            ]);
        }

        $cashRegister->delete();

        return back()->with('success', 'Caja eliminada.');
    }
}
