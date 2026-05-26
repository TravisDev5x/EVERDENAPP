import AppSidebar from '@/Components/AppSidebar';
import TrialBanner from '@/Components/TrialBanner';
import DisplayChromeControls from '@/Components/DisplayChromeControls';
import MobileBottomBar from '@/Components/MobileBottomBar';
import NotificationBell from '@/Components/NotificationBell';
import SkipToContent from '@/Components/SkipToContent';
import { useDeviceView } from '@/hooks/use-device-view';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Link } from '@inertiajs/react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/Components/ui/sidebar';
import { TooltipProvider } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const PhoneModeContext = createContext(false);

export function usePhoneMode() {
    return useContext(PhoneModeContext);
}

function MobileSidebarBridge() {
    const page = usePage();
    const { setOpenMobile } = useSidebar();

    useEffect(() => {
        setOpenMobile(false);
    }, [page.url, setOpenMobile]);

    return null;
}

function MobileSidebarSwipeBridge() {
    const { openMobile, setOpenMobile } = useSidebar();
    const sheetRef = useRef(null);

    useLayoutEffect(() => {
        if (!openMobile) {
            sheetRef.current = null;
            return;
        }
        sheetRef.current = document.querySelector(
            '[data-slot="sheet-content"][data-mobile="true"]',
        );
    }, [openMobile]);

    useSwipeToClose(sheetRef, () => setOpenMobile(false), openMobile, { side: 'left' });

    return null;
}

function LayoutMobileBottomBar({ visible, suppressScrollHide, placement }) {
    const { setOpenMobile } = useSidebar();

    return (
        <MobileBottomBar
            visible={visible}
            suppressScrollHide={suppressScrollHide}
            placement={placement}
            onOpenMenu={() => setOpenMobile(true)}
        />
    );
}

export default function AuthenticatedLayout({
    header,
    children,
    hideBottomBar = false,
    bottomBarPlacement = 'bottom',
}) {
    const { props, url } = usePage();
    const user = props.auth.user;
    const isPlatformOperator = props.auth.isPlatformOperator ?? false;
    const permissionKeys = props.auth.permissionKeys ?? [];
    const canViewTeamUsers = permissionKeys.includes('team.users.view');
    const canManageTeamUsers = permissionKeys.includes('team.users.manage');
    const canViewTeamRoles = permissionKeys.includes('team.roles.view');
    const canViewBranches = permissionKeys.includes('branches.view');
    const canViewCustody = permissionKeys.includes('customer-custody.view');
    const tenant = props.tenant ?? null;
    const tenantTitle = isPlatformOperator ? 'Plataforma' : (tenant?.name ?? 'Tu tienda');
    const flash = props.flash ?? {};

    const { forceDeviceView, toggle: toggleDeviceView } = useDeviceView();
    const isMobile = useIsMobile();
    const isPhoneMode = forceDeviceView || isMobile;
    const [topBarScrolled, setTopBarScrolled] = useState(false);
    const [scrollFadeOpacity, setScrollFadeOpacity] = useState(0);

    useEffect(() => {
        const threshold = 4;
        const main = document.getElementById('main-content');

        const onScroll = () => {
            const top =
                main && main.scrollHeight > main.clientHeight
                    ? main.scrollTop
                    : window.scrollY;
            setTopBarScrolled(top > threshold);
            setScrollFadeOpacity(top <= 0 ? 0 : Math.min(1, top / 24));
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        main?.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            main?.removeEventListener('scroll', onScroll);
        };
    }, [url]);

    const showSuspendedOverlay =
        tenant?.status === 'suspended' && !isPlatformOperator;

    return (
        <PhoneModeContext.Provider value={isPhoneMode}>
        <TooltipProvider delayDuration={0}>
            {showSuspendedOverlay ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md">
                    <Card className="mx-4 max-w-md rounded-2xl border-border/60 text-center shadow-xl">
                        <CardContent className="p-8">
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                                    <AlertTriangle className="h-7 w-7 text-destructive" />
                                </div>
                            </div>
                            <h2 className="mb-2 text-xl font-bold">Cuenta suspendida</h2>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Tu cuenta ha sido suspendida. Contacta a soporte para más
                                información.
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground/80">
                                contacto@everden.mx
                            </p>
                            <Link
                                href={route('tenant.billing')}
                                className="mt-6 inline-flex"
                            >
                                <Button variant="outline" size="sm" className="mt-6 gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Ver facturación
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
            <SkipToContent />
            <SidebarProvider defaultOpen>
                <MobileSidebarBridge />
                <MobileSidebarSwipeBridge />
                <AppSidebar
                    tenantTitle={tenantTitle}
                    user={user}
                    isPlatformOperator={isPlatformOperator}
                    canViewTeamUsers={canViewTeamUsers}
                    canManageTeamUsers={canManageTeamUsers}
                    canViewTeamRoles={canViewTeamRoles}
                    canViewBranches={canViewBranches}
                    canViewCustody={canViewCustody}
                    forceDeviceView={isPhoneMode}
                />
                <SidebarInset
                    id="main-content"
                    tabIndex={-1}
                    className="min-h-0 min-w-0 overflow-x-clip bg-background outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background flex flex-col"
                >
                    <header className="safe-px relative sticky top-0 z-30 flex h-14 shrink-0 overflow-visible sm:gap-3">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-20 transition-opacity duration-200 ease-out bg-gradient-to-b from-background via-background/60 to-transparent"
                            style={{ opacity: scrollFadeOpacity }}
                        />
                        <div className="relative z-10 flex h-14 w-full min-w-0 items-center gap-2 sm:gap-3">
                            <SidebarTrigger className="min-h-[44px] min-w-[44px] shrink-0" />
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 md:block">
                                    Panel
                                </span>
                                <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base sm:font-bold">
                                    {tenantTitle}
                                </span>
                            </div>
                            <NotificationBell />
                            <DisplayChromeControls
                                forceDeviceView={forceDeviceView}
                                onToggleDeviceView={toggleDeviceView}
                                className={isMobile ? 'hidden' : ''}
                            />
                        </div>
                    </header>

                    <TrialBanner tenant={tenant} isPlatformOperator={isPlatformOperator} />

                    <div
                        className={cn(
                            'relative flex min-h-0 min-w-0 flex-1 flex-col bg-background',
                            'md:pb-0',
                        )}
                    >
                        <div
                            className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[length:32px_32px] bg-[position:0_1px] [mask-image:linear-gradient(to_bottom,transparent_0px,black_28px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,black_28px)]"
                        />

                        <div className="safe-px relative mx-auto w-full max-w-7xl pt-3 sm:pt-4">
                            {flash?.success ? (
                                <div className="mb-4 rounded-xl border border-primary/20 bg-secondary p-3 text-sm font-medium text-secondary-foreground">
                                    {flash.success}
                                </div>
                            ) : null}
                            {flash?.error ? (
                                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                                    {flash.error}
                                </div>
                            ) : null}
                        </div>

                        {header ? (
                            <div className="safe-px relative mx-auto w-full max-w-7xl border-b border-border/80 pb-4 pt-2 sm:pb-6 sm:pt-2">
                                {header}
                            </div>
                        ) : null}

                        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-out">
                            {children}
                        </div>
                    </div>
                    <div
                        className="shrink-0 md:hidden"
                        style={{
                            height: 'calc(5rem + env(safe-area-inset-bottom))',
                        }}
                        aria-hidden="true"
                    />
                </SidebarInset>
                <LayoutMobileBottomBar
                    visible={isPhoneMode && !hideBottomBar}
                    suppressScrollHide={isPhoneMode && !hideBottomBar}
                    placement={bottomBarPlacement}
                />
            </SidebarProvider>
        </TooltipProvider>
        </PhoneModeContext.Provider>
    );
}
