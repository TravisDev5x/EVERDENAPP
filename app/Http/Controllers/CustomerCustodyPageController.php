<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerCustodyPageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_VIEW), 403);

        $query = trim((string) $request->query('q', ''));

        $customers = Customer::query()
            ->withCount('sales')
            ->when($query !== '', function ($builder) use ($query): void {
                $builder->where(function ($inner) use ($query): void {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('phone', 'like', "%{$query}%")
                        ->orWhere('tax_id', 'like', "%{$query}%");
                });
            })
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Customers/Custody', [
            'customers' => $customers,
            'filters' => [
                'q' => $query,
            ],
            'canManageCustody' => $request->user()?->hasPermission(Permissions::CUSTOMER_CUSTODY_MANAGE) ?? false,
            'privacyVersion' => config('privacy.customer_notice_version', 'everden-mx-v1'),
        ]);
    }
}
