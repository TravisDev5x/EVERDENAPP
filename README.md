# EVERDEN — Sistema POS SaaS Multi-tenant

> Punto de venta para comercios en México. Caja, inventario,
> ventas y reportes por sucursal, en un solo lugar.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13 + PHP 8.4 |
| Frontend | React 18 + Inertia.js v2 |
| Base de datos | PostgreSQL 15 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Pagos | Stripe + Laravel Cashier |
| Build | Vite 8 |
| Email (local) | Mailpit |
| Email (producción) | Resend.com |
| Storage (planificado) | Cloudflare R2 |

---

## 🏢 Arquitectura Multi-tenant

Everden es un SaaS multi-tenant por subdominio. Cada negocio
(tenant) accede exclusivamente a través de su subdominio:

    chocolateria.everden.com  → Chocolatería XYZ (tenant_id: 1)
    restaurante.everden.com   → Restaurante ABC  (tenant_id: 2)

### Principios de aislamiento
- BelongsToTenant → trait con Global Scope automático
- IdentifyTenant → resuelve tenant por subdominio antes de auth
- EnsureTenantContext → usuario pertenece al tenant activo
- google_id → UNIQUE compuesto (tenant_id, google_id)
- Billable → aplicado en Tenant, nunca en User

### Modelos globales (sin BelongsToTenant)
    App\Models\Plan  ← compartido por todos los tenants

---

## 💰 Planes

| Plan | Slug | Precio | Usuarios | Productos | Sucursales |
|---|---|---|---|---|---|
| Básico | standard | $299/mes | 3 | 100 | 1 |
| Pro | pro | $599/mes | 10 | Ilimitado | 3 |
| Enterprise | enterprise | $1,199/mes | Ilimitado | Ilimitado | Ilimitado |

- Trial: 7 días gratis con tarjeta al registrarse
- Ilimitado = -1 en BD
- Facturación: mensual en MXN
- CFDI: NO implementado aún (feature futuro)

---

## 👥 Jerarquía de permisos

    Superadmin       → eliminar usuarios/tenants, ver todo el sistema
    Admin (tenant)   → invitar, suspender miembros, gestionar negocio
    Supervisor       → reportes, gestionar productos
    Cajero           → solo opera el POS

---

## 🗂️ Estructura de rutas

    routes/
    ├── web.php                → solo require de otros archivos
    ├── auth.php               → Google OAuth + login + register
    └── web/
        ├── public.php         → landing, register, login (sin tenant)
        ├── dashboard.php      → rutas autenticadas del tenant
        ├── authenticated.php  → rutas autenticadas generales
        ├── platform.php       → operador de plataforma (superadmin)
        └── tenant.php         → rutas específicas del tenant

---

## ⚙️ Configuración local

### Requisitos
- PHP 8.4+
- PostgreSQL 15+
- Node.js 20+
- Composer 2+
- Laragon (recomendado para Windows)

### Instalación

    # 1. Clonar el repositorio
    git clone https://github.com/TravisDev5x/EVERDENAPP.git
    cd EVERDENAPP

    # 2. Instalar dependencias
    composer install
    npm install

    # 3. Configurar entorno
    cp .env.example .env
    php artisan key:generate

    # 4. Configurar .env con tus credenciales locales

    # 5. Crear BD y migrar
    php artisan migrate:fresh --seed

    # 6. Compilar assets
    npm run build

    # 7. Servidor local
    php artisan serve

### Variables de entorno requeridas

    APP_NAME=EVERDEN
    APP_URL=http://localhost:8000

    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=everden
    DB_USERNAME=postgres
    DB_PASSWORD=

    STRIPE_KEY=pk_test_...
    STRIPE_SECRET=sk_test_...
    VITE_STRIPE_KEY="${STRIPE_KEY}"

    MAIL_MAILER=smtp
    MAIL_HOST=127.0.0.1
    MAIL_PORT=1025

    DEV_TENANT_SLUG=demo-negocio

### Habilitar extensión PostgreSQL en PHP (Laragon)

    # Agregar al php.ini de Laragon:
    extension=pdo_pgsql
    extension=pgsql

---

## 🔐 Archivos críticos — NO modificar sin análisis previo

    app/Models/Concerns/BelongsToTenant.php    ← aislamiento multi-tenant
    app/Http/Middleware/EnsureTenantContext.php
    app/Http/Middleware/IdentifyTenant.php      ← resolución por subdominio
    app/Services/TenantResolver.php
    tests/                                      ← ningún archivo de tests

---

## 🧪 Tests

    php artisan test
    # Expected: 122 passed, 0 failed

Los tests usan SQLite :memory: (configurado en phpunit.xml).
La BD real usa PostgreSQL 15.

---

## 🌐 Infraestructura de producción (planificada)

    Dominio:  everden.mx
    DNS/CDN:  Cloudflare (wildcard *.everden.mx)
    VPS:      Hetzner CX22 (Ubuntu 24.04)
    Panel:    Laravel Forge
    SSL:      Let's Encrypt wildcard
    Storage:  Cloudflare R2
    Email:    Resend.com

---

## 📋 Estado del proyecto

### ✅ Implementado
- Multi-tenant por subdominio con aislamiento completo
- Google OAuth scoped por tenant (pendiente credenciales)
- Landing page con planes reales desde BD
- Flujo de registro completo con Stripe Elements
- Trial de 7 días con tarjeta
- Verificación de email (MustVerifyEmail)
- Reset de contraseña completo
- Email de bienvenida (WelcomeMail)
- PostgreSQL 15 configurado
- Stripe + Laravel Cashier instalado
- 3 planes con stripe_price_id en BD
- Sistema RBAC (roles y permisos)
- POS: ventas, caja, inventario, reportes
- Multi-sucursal
- Dashboard con reportes diarios
- BelongsToTenant acepta tenant_id explícito sin exigir contexto global
- 122 tests en verde

### ⏳ En desarrollo
- Wildcard subdominio en Laragon (local)
- Módulo de invitaciones de equipo
- Banner de trial en dashboard
- Middleware verified en rutas tenant
- Webhooks de Stripe
- Página de billing del tenant
- Traducciones en español (validation.*)
- Demo pre-cargada para producción

### 🔮 Planificado (no implementar aún)
- Imágenes con Cloudflare R2
- Addons por plan (+usuarios, +productos, +sucursales)
- Sistema de notificaciones
- API pública REST (plan Enterprise)
- CFDI / Facturación electrónica
- Modo offline
- WhatsApp para invitaciones

---

## 🗄️ Seeders

    # Orden obligatorio:
    php artisan db:seed --class=PlanSeeder        # planes globales primero
    php artisan db:seed --class=DemoUsersSeeder   # usuarios demo del tenant

    # O completo:
    php artisan migrate:fresh --seed

---

## 🎨 Convenciones de código

### PHP
- declare(strict_types=1) en todos los archivos
- Tipado completo en parámetros y retornos
- Clases: PascalCase | Métodos: camelCase

### React
- Functional components + hooks únicamente
- shadcn/ui EXCLUSIVAMENTE para UI
- Inertia props → NO fetch/axios separado
- Helpers: formatMxn → @/lib/money | cn → @/lib/utils

### Multi-tenant — checklist antes de cada query
- ¿La query filtra por tenant_id?
- ¿La escritura asigna tenant_id?
- ¿El FormRequest valida dentro del tenant?
- ¿La Policy verifica que el recurso pertenece al tenant?

---

## 📦 Comandos útiles

    # Tests
    php artisan test

    # Migraciones
    php artisan migrate:fresh --seed

    # Limpiar caché
    php artisan config:clear && php artisan route:clear && php artisan cache:clear

    # Build frontend
    npm run build

    # Dev con HMR
    npm run dev

    # Tinker
    php artisan tinker

---

## 📄 Licencia

Privado — todos los derechos reservados © 2026 Everden.
