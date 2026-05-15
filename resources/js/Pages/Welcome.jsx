import ApplicationLogo from '@/Components/ApplicationLogo';
import DisplayChromeControls from '@/Components/DisplayChromeControls';
import SkipToContent from '@/Components/SkipToContent';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Anchor,
    BarChart3,
    Building2,
    FileBarChart,
    Layers,
    Package,
    ShieldCheck,
    ShoppingCart,
    Wallet,
} from 'lucide-react';

/** Iconos lucide-react por clave de funcionalidad (alineado al registry shadcn). */
const FEATURE_ICONS = {
    building: Building2,
    cart: ShoppingCart,
    cash: Wallet,
    cube: Package,
    chart: BarChart3,
    report: FileBarChart,
};

const SECTION_SCROLL_CLASS = 'scroll-mt-28';

const NAV_LINKS = [
    { href: '#mision', label: 'Misión' },
    { href: '#ciclo', label: 'En qué creemos' },
    { href: '#empezar', label: 'Cómo empezar' },
    { href: '#ecosistema', label: 'Qué incluye' },
    { href: '#planes', label: 'Planes' },
    { href: '#faq', label: 'Preguntas' },
    { href: '#contacto', label: 'Contacto' },
];

/** Cuatro ideas que guían el producto (textos en lenguaje sencillo). */
const TRUST_CYCLE_PILLARS = [
    {
        key: 'robustez',
        icon: ShieldCheck,
        title: 'Tu información protegida',
        kicker: 'La base',
        body: 'Cada venta y cada cambio queda registrado. Tú decides quién entra al sistema y qué puede hacer; tu negocio y el de otros clientes van por separado.',
        accent: 'slate',
    },
    {
        key: 'vitalidad',
        icon: Activity,
        title: 'Ventas al día',
        kicker: 'El día a día',
        body: 'Cobras en mostrador, actualizas existencias y revisas el catálogo sin estar saltando entre programas. Lo que vendes se refleja de inmediato en caja e inventario.',
        accent: 'zinc',
    },
    {
        key: 'equilibrio',
        icon: Layers,
        title: 'Varias tiendas, un solo lugar',
        kicker: 'Sucursales',
        body: 'Si tienes más de una sucursal, cada una con su caja y su stock, y tú ves el panorama completo sin mezclar lo de una tienda con la otra.',
        accent: 'stone',
    },
    {
        key: 'permanencia',
        icon: Anchor,
        title: 'Hecho para quedarse',
        kicker: 'A largo plazo',
        body: 'Pensamos en comercios que llevan años en el mercado y en los que recién abren. La idea es que el sistema te acompañe mientras creces, no que lo cambies cada temporada.',
        accent: 'neutral',
    },
];

const FAQ_ITEMS = [
    {
        q: '¿Por qué confiar en esta plataforma a largo plazo?',
        a: 'Usamos tecnología estable y abierta, con respaldo de la información y registro de movimientos. Tu operación no queda atada a un solo proveedor ni a modas pasajeras.',
    },
    {
        q: '¿Cómo cuidan la información de mi negocio?',
        a: 'Cada negocio va en su propio espacio, con respaldos y permisos por usuario. Solo entra quien tú autorizas y puedes revisar qué se hizo en el sistema. Los detal legales están en el aviso de privacidad y los términos.',
    },
    {
        q: '¿Puedo manejar varias sucursales?',
        a: 'Sí. Cada sucursal tiene su caja, su inventario y sus reportes. Desde la oficina o matriz ves el total; en tienda solo se ve lo de esa sucursal.',
    },
    {
        q: '¿Hay soporte en México?',
        a: 'Sí: atención por correo y canales directos, guías para tu equipo y, en planes más amplios, una persona de seguimiento. Los tiempos de respuesta dependen del plan que contrates.',
    },
];

const PLAN_CARDS = [
    {
        name: 'Base',
        description: 'Para un mostrador o tienda que quiere orden desde el primer día.',
        highlight: false,
        priceLabel: 'Desde — MXN',
        bullets: [
            'Caja, tickets e inventario',
            'Usuarios con permisos claros',
            'Soporte estándar',
        ],
    },
    {
        name: 'Crecimiento',
        description: 'Varias sucursales con vista central. El más elegido para ir sumando tiendas.',
        highlight: true,
        priceLabel: 'Desde — MXN',
        bullets: [
            'Caja e inventario por sucursal',
            'Reportes por tienda y en conjunto',
            'Atención prioritaria',
        ],
    },
    {
        name: 'Empresa',
        description: 'Mucho volumen, enlaces con otros sistemas y acompañamiento cercano.',
        highlight: false,
        priceLabel: 'Cotización',
        bullets: [
            'Conexión con tu ERP u otros sistemas',
            'Instalación dedicada si la necesitas',
            'Ejecutivo de cuenta y respuesta acordada',
        ],
    },
];

/** Acentos neutros (slate/zinc/stone) — el verde queda solo en el contenedor del logo. */
const ACCENT_STYLES = {
    slate: {
        iconWrap:
            'bg-slate-500/10 ring-1 ring-slate-500/20 dark:bg-slate-500/15 dark:ring-slate-400/25',
        icon: 'text-slate-700 dark:text-slate-300',
        kicker: 'text-slate-700/85 dark:text-slate-300/85',
    },
    zinc: {
        iconWrap:
            'bg-zinc-500/10 ring-1 ring-zinc-500/20 dark:bg-zinc-500/15 dark:ring-zinc-400/25',
        icon: 'text-zinc-700 dark:text-zinc-300',
        kicker: 'text-zinc-700/85 dark:text-zinc-300/85',
    },
    stone: {
        iconWrap:
            'bg-stone-500/10 ring-1 ring-stone-500/20 dark:bg-stone-500/15 dark:ring-stone-400/25',
        icon: 'text-stone-700 dark:text-stone-300',
        kicker: 'text-stone-700/85 dark:text-stone-300/85',
    },
    neutral: {
        iconWrap:
            'bg-neutral-500/10 ring-1 ring-neutral-500/20 dark:bg-neutral-500/15 dark:ring-neutral-400/25',
        icon: 'text-neutral-700 dark:text-neutral-300',
        kicker: 'text-neutral-700/85 dark:text-neutral-300/85',
    },
};

/**
 * Landing pública — copy en español de México, tono cercano y sin jerga técnica.
 */
function ziggyRouteExists(name) {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

/**
 * Landing servida por Laravel + @routes (Ziggy). Abrí siempre la URL de la app (p.ej. APP_URL o vhost de Laragon),
 * no el puerto de Vite (5173/5174): ahí no hay props Inertia ni Ziggy completos.
 */
export default function Welcome({ canLogin, canRegister }) {
    const { auth, appName, siteUrl } = usePage().props;
    const canLoginUi = Boolean(canLogin) || ziggyRouteExists('login');
    const canRegisterUi = Boolean(canRegister) || ziggyRouteExists('register');
    const isPlatformOperator = auth.isPlatformOperator ?? false;
    const panelHref = isPlatformOperator ? route('platform.tenants.index') : route('dashboard');
    const panelLabel = isPlatformOperator ? 'Administración' : 'Entrar';
    const brand =
        (typeof appName === 'string' && appName) ||
        import.meta.env.VITE_APP_NAME ||
        'EVERDEN';
    const baseUrl = typeof siteUrl === 'string' ? siteUrl : '';

    const metaDescription =
        `${brand} — Punto de venta para comercios en México. Caja, inventario, ventas y reportes en un solo lugar, por sucursal.`;

    const canonicalUrl = baseUrl ? `${baseUrl}/` : '';
    const ogImageUrl = baseUrl ? `${baseUrl}/images/og-placeholder.svg` : '';

    const features = [
        {
            icon: 'building',
            title: 'Varias sucursales',
            body: 'Cada tienda con su propia caja e inventario. Cambias de sucursal sin perder el hilo de lo que estás viendo.',
        },
        {
            icon: 'cart',
            title: 'Ventas en mostrador',
            body: 'Cobras con la caja abierta, generas el ticket y, si tienes impresora, puedes imprimirlo. Lo vendido se refleja al momento en tu operación.',
        },
        {
            icon: 'cash',
            title: 'Caja y corte',
            body: 'Abres turno, registras cobros y cierras con el conteo de efectivo. Si hay diferencia, queda anotada para revisarla.',
        },
        {
            icon: 'cube',
            title: 'Inventario',
            body: 'Ves existencias por tienda, mínimos y avisos cuando falta producto. El catálogo va al ritmo de lo que realmente tienes en anaquel.',
        },
        {
            icon: 'chart',
            title: 'Tus números claros',
            body: 'Movimientos ordenados para cuadrar ventas con lo que esperas en caja. Menos sorpresas al cerrar el día.',
        },
        {
            icon: 'report',
            title: 'Resumen del día',
            body: 'Pantalla principal y reporte diario para ver cómo va el negocio sin revisar pantalla por pantalla.',
        },
    ];

    const steps = [
        {
            n: '01',
            title: 'Registra tu negocio',
            body: 'Creas la cuenta, das de alta tu comercio y al primer usuario con acceso de dueño o administrador.',
        },
        {
            n: '02',
            title: 'Arma tu tienda y caja',
            body: 'Eliges la sucursal activa, cargas productos y asignas la caja con la que cobrarás.',
        },
        {
            n: '03',
            title: 'Empieza a vender',
            body: 'Cobras en mostrador, imprimes ticket si lo necesitas y al cierre revisas cómo te fue el día.',
        },
    ];

    return (
        <>
            <Head title={`${brand} · Punto de venta para tu negocio`}>
                <meta name="description" content={metaDescription} />
                {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${brand} · Caja e inventario para comercios`} />
                <meta property="og:description" content={metaDescription} />
                {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
                <meta property="og:site_name" content={brand} />
                {ogImageUrl ? (
                    <>
                        <meta property="og:image" content={ogImageUrl} />
                        <meta property="og:image:width" content="1200" />
                        <meta property="og:image:height" content="630" />
                        <meta property="og:image:alt" content={`${brand} · punto de venta`} />
                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content={`${brand} · Punto de venta en México`} />
                        <meta name="twitter:description" content={metaDescription} />
                        <meta name="twitter:image" content={ogImageUrl} />
                    </>
                ) : null}
            </Head>

            <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <SkipToContent />
                <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                    {/* Capas decorativas con blur moderado: menos costo de pintura que blur-3xl masivo */}
                    <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-slate-400/18 blur-2xl dark:bg-slate-600/12" />
                    <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-slate-300/15 blur-2xl dark:bg-slate-500/10" />
                    <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-zinc-400/12 blur-2xl dark:bg-zinc-600/10" />
                    <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-slate-400/10 blur-xl dark:bg-slate-600/8" />
                </div>

                <div className="relative">
                    <header className="safe-px sticky top-0 z-40 border-b border-slate-200/90 bg-white/92 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/92 supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80">
                        <div className="mx-auto flex max-w-6xl flex-col gap-3 py-3 sm:gap-4 sm:py-4 lg:px-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <a
                                    href="#inicio"
                                    className="flex min-w-0 items-center gap-3 rounded-xl outline-hidden ring-ring/0 transition focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-700 via-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 dark:ring-white/10">
                                        <ApplicationLogo className="h-8 w-8 fill-white opacity-95" />
                                    </span>
                                    <div className="min-w-0 text-left">
                                        <p className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                                            {brand}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Punto de venta
                                        </p>
                                    </div>
                                </a>

                                <nav
                                    aria-label="Principal"
                                    className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3"
                                >
                                    <DisplayChromeControls />
                                    {auth.user ? (
                                        <Button asChild size="lg" className="min-h-11 rounded-xl">
                                            <Link href={panelHref}>{panelLabel}</Link>
                                        </Button>
                                    ) : (
                                        <>
                                            {canLoginUi && (
                                                <Button variant="ghost" size="lg" asChild className="min-h-11 rounded-xl">
                                                    <Link href={route('login')}>Iniciar sesión</Link>
                                                </Button>
                                            )}
                                            {canRegisterUi && (
                                                <Button
                                                    size="lg"
                                                    asChild
                                                    className="min-h-11 rounded-xl"
                                                >
                                                    <Link href={route('register')}>Crear cuenta</Link>
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </nav>
                            </div>

                            <nav
                                aria-label="En esta página"
                                className="touch-scroll-x -mx-1 flex gap-1 overflow-x-auto border-t border-slate-200/80 pb-1 pt-3 scrollbar-hide dark:border-white/10 sm:flex-wrap sm:justify-center sm:gap-x-2 sm:gap-y-2 sm:overflow-visible sm:pb-0 sm:pt-4 lg:justify-start lg:gap-x-1"
                            >
                                {NAV_LINKS.map((item) => (
                                    <Button key={item.href} variant="ghost" size="sm" asChild className="shrink-0 text-slate-600 dark:text-slate-400">
                                        <a href={item.href}>{item.label}</a>
                                    </Button>
                                ))}
                            </nav>
                        </div>
                    </header>

                    <main
                        id="main-content"
                        tabIndex={-1}
                        className="outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950"
                    >
                        {/* Hero */}
                        <section
                            id="inicio"
                            className={`safe-px mx-auto max-w-6xl pb-12 pt-10 sm:pb-16 sm:pt-12 lg:flex lg:items-center lg:gap-12 lg:px-8 lg:pb-24 lg:pt-16 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="max-w-xl flex-1 lg:max-w-none">
                                <Badge
                                    variant="outline"
                                    className="inline-flex items-center gap-2 rounded-full border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium normal-case text-foreground"
                                >
                                    <span
                                        className="inline-flex h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse"
                                        aria-hidden
                                    />
                                    Listo para operar en tu tienda
                                </Badge>
                                <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                                    Ordena tu tienda con{' '}
                                    <span className="bg-gradient-to-r from-slate-800 via-slate-600 to-slate-500 bg-clip-text text-transparent dark:from-slate-200 dark:via-slate-100 dark:to-white">
                                        caja e inventario
                                    </span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                    {brand} reúne en un solo lugar lo que necesitas para vender en mostrador:
                                    cobrar, llevar existencias y ver reportes por sucursal. Pensado para comercios
                                    en México que quieren menos papelitos y más claridad al cerrar el día.
                                </p>
                                <div className="mt-10 flex flex-wrap items-center gap-4">
                                    {canRegisterUi && !auth.user && (
                                        <Button
                                            size="lg"
                                            asChild
                                            className="h-12 rounded-xl px-7 text-base font-semibold"
                                        >
                                            <Link href={route('register')}>Crear cuenta gratis</Link>
                                        </Button>
                                    )}
                                    {canLoginUi && !auth.user && (
                                        <Button variant="outline" size="lg" asChild className="h-12 rounded-xl px-7 text-base font-semibold">
                                            <Link href={route('login')}>Ya tengo cuenta</Link>
                                        </Button>
                                    )}
                                    {auth.user && (
                                        <Button
                                            size="lg"
                                            asChild
                                            className="h-12 rounded-xl px-7 text-base font-semibold"
                                        >
                                            <Link href={panelHref}>
                                                {isPlatformOperator ? 'Administración' : 'Entrar'}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-8 text-sm text-slate-500 dark:text-slate-500">
                                    Registro de movimientos · Datos separados por negocio · Aviso de privacidad y términos al pie
                                </p>
                            </div>

                            {/* Mock UI */}
                            <div className="mt-14 flex flex-1 justify-center lg:mt-0 lg:justify-end">
                                <div className="relative w-full max-w-md">
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-slate-400/15 via-slate-300/10 to-zinc-400/15 blur-sm dark:from-slate-700/25 dark:via-slate-600/15" />
                                    <Card className="relative overflow-hidden rounded-2xl border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    Venta en mostrador
                                                </CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-medium">
                                                Sucursal activa
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex gap-2">
                                                <div className="h-9 flex-1 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                                <div className="h-9 w-24 rounded-lg bg-primary/85 dark:bg-primary/90" />
                                            </div>
                                            <div className="space-y-2 rounded-xl border border-slate-100 p-3 dark:border-white/10">
                                                <div className="flex justify-between text-[11px] text-slate-500">
                                                    <span>Ticket</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300">
                                                        #1284
                                                    </span>
                                                </div>
                                                {[55, 42, 38].map((w) => (
                                                    <div key={w} className="flex items-center gap-2">
                                                        <div
                                                            className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"
                                                            style={{ width: `${w}%` }}
                                                        />
                                                        <span className="text-[10px] text-slate-400">${w}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-10 flex-1 rounded-lg bg-slate-900 text-center text-[10px] font-semibold leading-10 text-white dark:bg-white dark:text-slate-900">
                                                    Cobrar
                                                </div>
                                                <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-white/15" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* Misión */}
                        <section
                            id="mision"
                            className={`relative overflow-hidden border-y border-slate-800/40 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 py-20 text-white dark:border-white/10 dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="pointer-events-none absolute inset-0 opacity-40">
                                <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                                <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl" />
                            </div>
                            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                                <Badge
                                    variant="outline"
                                    className="inline-flex rounded-full border-white/25 bg-white/10 px-3 py-1 text-xs font-medium normal-case text-white/95"
                                >
                                    Nuestra misión
                                </Badge>
                                <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Una herramienta{' '}
                                    <span className="bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
                                        hecha para el mostrador
                                    </span>
                                </h2>
                                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
                                    Queremos que vender, cobrar y revisar tu inventario sea sencillo. {brand} no es
                                    solo otro programa: es el lugar donde tu equipo trabaja el día a día y donde
                                    ves si el negocio va bien.
                                </p>
                                <div className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-3">
                                    <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15">
                                        Caja e inventario
                                    </Badge>
                                    <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15">
                                        Varias sucursales
                                    </Badge>
                                    <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15">
                                        Reportes al cierre
                                    </Badge>
                                </div>
                            </div>
                        </section>

                        {/* En qué creemos */}
                        <section
                            id="ciclo"
                            className={`border-b border-slate-200/80 bg-white/70 py-20 dark:border-white/10 dark:bg-slate-900/40 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <div className="mx-auto max-w-2xl text-center">
                                    <Badge
                                        variant="outline"
                                        className="inline-flex rounded-full border-slate-600/40 bg-slate-800/30 px-3 py-1 text-xs font-medium normal-case text-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white"
                                    >
                                        Lo que nos guía
                                    </Badge>
                                    <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                        En qué creemos
                                    </h2>
                                    <p className="mt-4 text-slate-600 dark:text-slate-400">
                                        Cuatro ideas que guían cómo armamos {brand}: seguridad, ventas al día,
                                        varias tiendas sin enredo y una herramienta que se quede contigo.
                                    </p>
                                </div>
                                <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {TRUST_CYCLE_PILLARS.map((pillar) => {
                                        const Icon = pillar.icon;
                                        const styles = ACCENT_STYLES[pillar.accent] ?? ACCENT_STYLES.slate;
                                        return (
                                            <Card
                                                key={pillar.key}
                                                className={cn(
                                                    'group relative flex h-full flex-col overflow-hidden border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md',
                                                    'dark:border-white/10 dark:bg-slate-950/40',
                                                )}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div
                                                        className={cn(
                                                            'flex h-12 w-12 items-center justify-center rounded-xl',
                                                            styles.iconWrap,
                                                        )}
                                                    >
                                                        <Icon className={cn('h-6 w-6', styles.icon)} aria-hidden />
                                                    </div>
                                                    <p
                                                        className={cn(
                                                            'mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                                            styles.kicker,
                                                        )}
                                                    >
                                                        {pillar.kicker}
                                                    </p>
                                                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                                                        {pillar.title}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1">
                                                    <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                        {pillar.body}
                                                    </CardDescription>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Cómo empezar */}
                        <section
                            id="empezar"
                            className={`mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="mx-auto max-w-2xl text-center">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Empieza en tres pasos
                                </h2>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">
                                    En una tarde puedes tener la tienda lista para cobrar el primer ticket con orden.
                                </p>
                            </div>
                            <ol className="mt-14 grid gap-8 md:grid-cols-3">
                                {steps.map((s, i) => (
                                    <li key={s.n} className="relative list-none">
                                        <Card className="flex h-full flex-col border-slate-200 bg-white shadow-xs dark:border-white/10 dark:bg-slate-900/60">
                                            {i < steps.length - 1 && (
                                                <div
                                                    className="absolute -right-4 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-gradient-to-r from-slate-300/60 to-transparent md:block dark:from-slate-600/50"
                                                    aria-hidden
                                                />
                                            )}
                                            <CardHeader className="pb-2">
                                                <Badge
                                                    variant="outline"
                                                    className="w-fit font-mono text-xs font-bold normal-case text-slate-700 dark:text-slate-300"
                                                >
                                                    {s.n}
                                                </Badge>
                                                <CardTitle className="text-lg text-slate-900 dark:text-white">
                                                    {s.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                    {s.body}
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* Qué incluye */}
                        <section
                            id="ecosistema"
                            className={`border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 py-20 dark:border-white/10 dark:from-slate-950 dark:to-slate-900/80 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <div className="max-w-2xl">
                                    <Badge
                                        variant="outline"
                                        className="inline-flex rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium normal-case text-foreground"
                                    >
                                        Qué incluye
                                    </Badge>
                                    <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                        Todo conectado en tu tienda
                                    </h2>
                                    <p className="mt-4 text-slate-600 dark:text-slate-400">
                                        Lo que vendes mueve la caja, la caja actualiza el inventario y los reportes
                                        te dicen cómo cerró el día. Siempre en la sucursal que tengas seleccionada.
                                    </p>
                                </div>
                                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {features.map((item) => {
                                        const Icon = FEATURE_ICONS[item.icon];
                                        return (
                                            <Card
                                                key={item.title}
                                                className="group flex flex-col border-slate-200 bg-white shadow-xs transition hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-slate-950/50 dark:hover:border-primary/25"
                                            >
                                                <CardHeader className="pb-2">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted dark:bg-muted/80">
                                                        <Icon
                                                            className="h-6 w-6 text-foreground"
                                                            aria-hidden
                                                        />
                                                    </div>
                                                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                                                        {item.title}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1">
                                                    <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                        {item.body}
                                                    </CardDescription>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Planes */}
                        <section
                            id="planes"
                            className={`mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="mx-auto max-w-2xl text-center">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Planes según el tamaño de tu negocio
                                </h2>
                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                                    Desde un solo mostrador hasta varias sucursales. Precios en pesos mexicanos;
                                    el detalle lo vemos contigo al solicitar información.
                                </p>
                            </div>
                            <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
                                {PLAN_CARDS.map((plan) => (
                                    <Card
                                        key={plan.name}
                                        className={cn(
                                            'relative flex h-full flex-col overflow-visible bg-card py-6 shadow-md ring-1 ring-border',
                                            plan.highlight
                                                ? 'border-2 border-primary/35 bg-gradient-to-b from-primary/[0.08] to-card pt-9 dark:border-primary/30 dark:from-primary/10'
                                                : 'border border-border',
                                        )}
                                    >
                                        {plan.highlight ? (
                                            <Badge className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 bg-primary px-3 py-1 text-xs font-semibold normal-case text-primary-foreground shadow-xs hover:bg-primary/90">
                                                Recomendado
                                            </Badge>
                                        ) : null}
                                        <CardHeader className="gap-2 pb-2">
                                            <CardTitle className="text-xl font-semibold leading-tight text-card-foreground">
                                                {plan.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm leading-snug">
                                                {plan.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col gap-5 pb-4">
                                            <p className="text-2xl font-bold tabular-nums tracking-tight text-card-foreground">
                                                {plan.priceLabel}
                                            </p>
                                            <ul className="mt-auto space-y-2.5 text-sm text-muted-foreground">
                                                {plan.bullets.map((b) => (
                                                    <li key={b} className="flex gap-2.5 leading-snug">
                                                        <span
                                                            className="mt-0.5 shrink-0 text-primary"
                                                            aria-hidden
                                                        >
                                                            ✓
                                                        </span>
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="mt-auto flex-col gap-2 border-t border-border bg-muted/30 p-4 dark:bg-muted/20">
                                            {plan.highlight ? (
                                                <Button
                                                    size="lg"
                                                    asChild
                                                    className="w-full rounded-xl"
                                                >
                                                    <Link href={route('register')}>Solicitar información</Link>
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="lg" asChild className="w-full rounded-xl">
                                                    <Link href={route('register')}>Solicitar información</Link>
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* FAQ — <details> nativo evita cargar Radix Accordion en esta página */}
                        <section
                            id="faq"
                            className={`border-t border-slate-200 bg-slate-50/80 py-20 dark:border-white/10 dark:bg-slate-950/50 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                                <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Preguntas frecuentes
                                </h2>
                                <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-600 dark:text-slate-400">
                                    Dudas comunes antes de usar {brand} en tu tienda.
                                </p>
                                <Card className="mt-10 border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60">
                                    <CardContent className="space-y-2 px-2 pt-6 sm:px-4">
                                        {FAQ_ITEMS.map((item) => (
                                            <details
                                                key={item.q}
                                                className="group rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1 open:bg-white open:shadow-xs dark:border-white/10 dark:bg-slate-950/40 dark:open:bg-slate-900/80"
                                            >
                                                <summary className="cursor-pointer list-none py-3 pr-8 font-semibold text-slate-900 outline-none marker:hidden [&::-webkit-details-marker]:hidden dark:text-white">
                                                    <span className="relative flex items-start justify-between gap-3">
                                                        <span className="min-w-0 flex-1">{item.q}</span>
                                                        <span
                                                            className="mt-0.5 shrink-0 text-slate-400 text-xs tabular-nums dark:text-slate-500"
                                                            aria-hidden
                                                        >
                                                            +
                                                        </span>
                                                    </span>
                                                </summary>
                                                <div className="border-t border-slate-100 pb-4 pt-2 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-400">
                                                    {item.a}
                                                </div>
                                            </details>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Contacto */}
                        <section
                            id="contacto"
                            className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${SECTION_SCROLL_CLASS}`}
                        >
                            <Card className="gap-0 overflow-hidden rounded-3xl border-border p-0 shadow-lg ring-1 ring-border">
                                <div className="grid lg:grid-cols-2 lg:items-stretch">
                                    <div className="flex h-full min-h-[240px] flex-col justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 px-8 py-10 sm:px-10 dark:from-slate-900/80 dark:via-slate-950/60 dark:to-zinc-950/50">
                                        <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                                            Platiquemos de tu negocio
                                        </h2>
                                        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                                            Cuéntanos cómo trabajas hoy en caja e inventario y vemos si {brand} te
                                            conviene. Atendemos desde México.
                                        </p>
                                    </div>
                                    <CardContent className="flex h-full flex-col justify-center border-t border-border bg-card px-8 py-10 sm:px-10 lg:border-l lg:border-t-0">
                                        <p className="mb-6 text-xs text-muted-foreground">
                                            Datos comerciales — actualizar antes de salir a producción.
                                        </p>
                                        <dl className="space-y-6">
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Correo
                                                </dt>
                                                <dd className="mt-1.5">
                                                    <Button
                                                        variant="link"
                                                        asChild
                                                        className="h-auto min-h-0 p-0 text-base font-semibold text-primary hover:text-primary/90"
                                                    >
                                                        <a href="mailto:contacto@everden.mx">contacto@everden.mx</a>
                                                    </Button>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Teléfono
                                                </dt>
                                                <dd className="mt-1.5 text-base font-medium tabular-nums text-card-foreground">
                                                    +52 (55) 0000-0000
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    WhatsApp
                                                </dt>
                                                <dd className="mt-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-lg px-3 py-1.5 text-sm font-normal text-muted-foreground"
                                                    >
                                                        Enlace por configurar
                                                    </Badge>
                                                </dd>
                                            </div>
                                        </dl>
                                    </CardContent>
                                </div>
                            </Card>
                        </section>

                        {/* CTA Final */}
                        <section
                            id="cta-final"
                            className={`mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8 ${SECTION_SCROLL_CLASS}`}
                        >
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 px-8 py-16 text-center shadow-2xl dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
                                <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />
                                <div className="relative">
                                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                                        ¿Listo para probarlo en tu tienda?
                                    </h2>
                                    <p className="mx-auto mt-5 max-w-xl text-base text-white/85">
                                        Abre una cuenta de prueba o entra si ya te registraste. {brand} te ayuda a
                                        llevar caja e inventario con más claridad.
                                    </p>
                                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                        {canRegisterUi && !auth.user && (
                                            <Button
                                                size="lg"
                                                asChild
                                                className="h-12 rounded-xl px-8 text-base font-semibold"
                                            >
                                                <Link href={route('register')}>Crear cuenta gratis</Link>
                                            </Button>
                                        )}
                                        {canLoginUi && !auth.user && (
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                asChild
                                                className="h-12 rounded-xl border-white/25 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/20"
                                            >
                                                <Link href={route('login')}>Iniciar sesión</Link>
                                            </Button>
                                        )}
                                        {auth.user && (
                                            <Button
                                                size="lg"
                                                asChild
                                                className="h-12 rounded-xl px-8 text-base font-semibold"
                                            >
                                                <Link href={panelHref}>Entrar a mi cuenta</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>

                    <footer className="border-t border-slate-200 bg-white py-14 dark:border-white/10 dark:bg-slate-950">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-700 via-emerald-600 to-teal-600">
                                            <ApplicationLogo className="h-6 w-6 fill-white" />
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{brand}</span>
                                    </div>
                                    <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        Punto de venta para comercios en México: caja, inventario, ventas y
                                        reportes por sucursal, en un solo lugar.
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Legal
                                    </p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li>
                                            <Link
                                                href={route('legal.privacy')}
                                                className="text-primary hover:text-primary/90"
                                            >
                                                Aviso de privacidad
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href={route('legal.terms')}
                                                className="text-primary hover:text-primary/90"
                                            >
                                                Términos del servicio
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Acceso
                                    </p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        {canLoginUi && (
                                            <li>
                                                <Link
                                                    href={route('login')}
                                                    className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                                >
                                                    Iniciar sesión
                                                </Link>
                                            </li>
                                        )}
                                        {canRegisterUi && (
                                            <li>
                                                <Link
                                                    href={route('register')}
                                                    className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                                >
                                                    Registro
                                                </Link>
                                            </li>
                                        )}
                                        <li>
                                            <a
                                                href="#contacto"
                                                className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                            >
                                                Contacto
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <Separator className="my-10 bg-border" />
                            <div className="flex flex-col gap-2 pt-2 text-xs text-muted-foreground">
                                <p>© {new Date().getFullYear()} {brand}. Todos los derechos reservados.</p>
                                <p>
                                    Razón social, RFC y datos de contacto comercial:{' '}
                                    <span className="text-slate-600 dark:text-slate-400">
                                        pendientes de sustituir antes de producción.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
