<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ActiveBranchController extends Controller
{
    public function update(Request $request, Branch $branch): RedirectResponse
    {
        if ((int) $branch->tenant_id !== (int) $request->user()->tenant_id || ! $branch->is_active) {
            abort(403, 'Sucursal invalida para el tenant actual.');
        }

        $request->user()->forceFill([
            'branch_id' => $branch->id,
        ])->save();

        return back()->with('success', 'Sucursal activa actualizada.');
    }
}
