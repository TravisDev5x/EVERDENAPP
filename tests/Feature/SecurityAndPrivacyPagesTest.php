<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityAndPrivacyPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_privacy_and_terms_pages_are_public(): void
    {
        $this->get(route('legal.privacy'))->assertOk();
        $this->get(route('legal.terms'))->assertOk();
    }

    public function test_security_headers_are_applied_on_public_pages(): void
    {
        $response = $this->get('/');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
