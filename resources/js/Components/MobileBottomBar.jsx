import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, Menu, Package, ShoppingCart } from 'lucide-react';

const glassBarClass =
    'border border-white/25 bg-background/45 shadow-[0_8px_32px_rgba(15,23,42,0.14)] ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-background/35 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] dark:ring-white/5';

function navItemClass(active) {
    return cn(
        'flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all duration-200',
        active
            ? 'bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-primary/25 backdrop-blur-sm'
            : 'text-muted-foreground hover:bg-white/20 hover:text-foreground dark:hover:bg-white/5',
    );
}

function NavItem({ href, label, icon: Icon, active }) {
    return (
        <Link href={href} className={navItemClass(active)}>
            <Icon className="h-5 w-5 shrink-0 stroke-[1.75]" aria-hidden />
            <span className="text-center text-[10px] font-medium leading-none tracking-wide">
                {label}
            </span>
        </Link>
    );
}

export default function MobileBottomBar({ visible, onOpenMenu }) {
    const isDashboard = route().current('dashboard');
    const isSales = route().current('sales.page');
    const isInventory = route().current('inventory.page');

    return (
        <div
            className={cn(
                'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
                visible ? 'flex' : 'flex md:hidden',
            )}
        >
            <nav
                aria-label="Navegación rápida"
                className={cn(
                    'pointer-events-auto grid h-[4.25rem] w-full max-w-lg grid-cols-4 items-stretch gap-1.5 rounded-[1.5rem] px-2.5 py-2',
                    glassBarClass,
                )}
            >
                <NavItem
                    href={route('dashboard')}
                    label="Inicio"
                    icon={LayoutDashboard}
                    active={isDashboard}
                />
                <NavItem
                    href={route('sales.page')}
                    label="Ventas"
                    icon={ShoppingCart}
                    active={isSales}
                />
                <NavItem
                    href={route('inventory.page')}
                    label="Inventario"
                    icon={Package}
                    active={isInventory}
                />
                <button
                    type="button"
                    onClick={onOpenMenu}
                    className={navItemClass(false)}
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5 shrink-0 stroke-[1.75]" aria-hidden />
                    <span className="text-center text-[10px] font-medium leading-none tracking-wide">
                        Menú
                    </span>
                </button>
            </nav>
        </div>
    );
}
