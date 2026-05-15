<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Test;
use ReflectionClass;
use Symfony\Component\Finder\Finder;
use Tests\TestCase;

class TenantModelAuditTest extends TestCase
{
    private const EXEMPT = [
        \App\Models\User::class,
        \App\Models\Tenant::class,
        \App\Models\Permission::class,
        // Plan: modelo global de plataforma, los planes no pertenecen
        // a ningún tenant — son compartidos por todos los negocios.
        \App\Models\Plan::class,
    ];

    #[Test]
    public function all_business_models_implement_belongs_to_tenant(): void
    {
        $failures = [];

        foreach ($this->discoverModels() as $class) {
            if (in_array($class, self::EXEMPT, true)) {
                continue;
            }

            $uses = class_uses_recursive($class);

            if (! isset($uses[\App\Models\Concerns\BelongsToTenant::class])) {
                $failures[] = $class;
            }
        }

        $this->assertEmpty(
            $failures,
            "Los siguientes modelos NO implementan BelongsToTenant:\n- "
            . implode("\n- ", $failures)
            . "\n\nAgrega el trait o añádelos a EXEMPT con justificación."
        );
    }

    /** @return list<class-string> */
    private function discoverModels(): array
    {
        $finder = Finder::create()
            ->files()
            ->in(app_path('Models'))
            ->name('*.php')
            ->notPath('Concerns');

        $classes = [];

        foreach ($finder as $file) {
            $class = 'App\\Models\\' . str_replace(
                ['/', '.php'],
                ['\\', ''],
                $file->getRelativePathname()
            );

            if (class_exists($class)) {
                $ref = new ReflectionClass($class);
                if (! $ref->isAbstract() && ! $ref->isInterface() && ! $ref->isTrait()) {
                    $classes[] = $class;
                }
            }
        }

        return $classes;
    }
}
