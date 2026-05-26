import { useIsMobile } from '@/hooks/use-is-mobile';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, Menu, Package, ShoppingCart } from 'lucide-react';

const glassBarClass =
    'border border-border/70 bg-background/95 shadow-lg ring-1 ring-border/50 backdrop-blur-md dark:bg-background/90';

function navItemClass(active) {
    return cn(
        'flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all duration-200',
        active
            ? 'bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-primary/25'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
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

export default function MobileBottomBar({
    visible,
    onOpenMenu,
    suppressScrollHide = false,
    placement = 'bottom',
}) {
    const isMobile = useIsMobile();
    const { isHidden } = useScrollDirection();
    const hideOnScroll = !isMobile && isHidden && !suppressScrollHide;
    const isOffScreen = !visible || hideOnScroll;
    const isTop = placement === 'top';

    const isDashboard = route().current('dashboard');
    const isSales = route().current('sales.page');
    const isInventory = route().current('inventory.page');

    return (
        <div
            aria-hidden={isOffScreen}
            className={cn(
                'pointer-events-none fixed inset-x-0 z-50',
                'flex justify-center px-4',
                'will-change-[transform,opacity]',
                'transition-[transform,opacity] duration-200 ease-out',
                'motion-reduce:transition-none',
                isTop
                    ? 'top-11 pt-1'
                    : 'bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]',
                isOffScreen
                    ? isTop
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                    : 'translate-y-0 opacity-100',
            )}
        >
            <nav
                aria-label="Navegación rápida"
                className={cn(
                    'grid h-[4.25rem] w-full max-w-lg grid-cols-4 items-stretch gap-1.5 rounded-[1.5rem] px-2.5 py-2',
                    glassBarClass,
                    isOffScreen ? 'pointer-events-none' : 'pointer-events-auto',
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
