<?php

namespace Tests\Unit;

use App\Support\ScanCodeNormalizer;
use PHPUnit\Framework\TestCase;

class ScanCodeNormalizerTest extends TestCase
{
    public function test_plain_sku_returns_single_candidate(): void
    {
        $this->assertSame(['ABC-123'], ScanCodeNormalizer::candidateCodes('ABC-123'));
    }

    public function test_url_with_sku_query(): void
    {
        $codes = ScanCodeNormalizer::candidateCodes('https://tienda.example/catalogo?sku=PROD-99&utm=1');
        $this->assertContains('PROD-99', $codes);
        $this->assertContains('https://tienda.example/catalogo?sku=PROD-99&utm=1', $codes);
    }

    public function test_url_path_segments(): void
    {
        $codes = ScanCodeNormalizer::candidateCodes('https://tienda.example/p/HELLO-SKU/x');
        $this->assertContains('HELLO-SKU', $codes);
        $this->assertContains('x', $codes);
    }
}
