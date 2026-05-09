<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Avisos legales y privacidad (base documental LFPDPPP / referencia ISO 27701).
 */
class LegalNoticeController extends Controller
{
    public function privacy(): Response
    {
        return Inertia::render('Legal/PrivacyNotice', [
            'contactEmail' => config('privacy.contact_email'),
            'organizationName' => config('privacy.organization_name'),
            'retentionDays' => config('privacy.retention_days'),
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('Legal/TermsOfService', [
            'organizationName' => config('privacy.organization_name'),
            'contactEmail' => config('privacy.contact_email'),
        ]);
    }
}
