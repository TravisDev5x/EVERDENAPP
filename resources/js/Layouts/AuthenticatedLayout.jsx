import AppSidebar from '@/Components/AppSidebar';
import DisplayChromeControls from '@/Components/DisplayChromeControls';
import SkipToContent from '@/Components/SkipToContent';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/Components/ui/sidebar';
import { TooltipProvider } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function MobileSidebarBridge() {
    const page = usePage();
    const { setOpenMobile } = useSidebar();

    useEffect(() => {
        setOpenMobile(false);
    }, [page.url, setOpenMobile]);

    return null;
}

export default function AuthenticatedLayout({ header, children }) {
    const { props, url } = usePage();
    const user = props.auth.user;
    const isPlatformOperator = props.auth.isPlatformOperator ?? false;
    const permissionKeys = props.auth.permissionKeys ?? [];
    const canViewTeamUsers = permissionKeys.includes('team.users.view');
    const canViewTeamRoles = permissionKeys.includes('team.roles.view');
    const canViewBranches = permissionKeys.includes('branches.view');
    const canViewCustody = permissionKeys.includes('customer-custody.view');
    const tenantTitle = isPlatformOperator ? 'Plataforma' : (props.tenant?.name ?? 'Tu tienda');
    const flash = props.flash ?? {};

    const [topBarScrolled, setTopBarScrolled] = useState(false);

    useEffect(() => {
        const threshold = 8;
        const onScroll = () => {
            setTopBarScrolled(window.scrollY > threshold);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [url]);

    return (
        <TooltipProvider delayDuration={0}>
            <SkipToContent />
            <SidebarProvider defaultOpen>
                <MobileSidebarBridge />
                <AppSidebar
                    tenantTitle={tenantTitle}
                    user={user}
                    isPlatformOperator={isPlatformOperator}
                    canViewTeamUsers={canViewTeamUsers}
                    canViewTeamRoles={canViewTeamRoles}
                    canViewBranches={canViewBranches}
                    canViewCustody={canViewCustody}
                />
                <SidebarInset
                    id="main-content"
                    tabIndex={-1}
                    className={cn(
                        /* Mismo lienzo que body (como Welcome): menos capas oscuras superpuestas */
                        'min-h-0 min-w-0 overflow-x-clip bg-background outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
                    )}
                >
                    <header
                        className={cn(
                            'safe-px sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 transition-[background-color,box-shadow,backdrop-filter] duration-200 ease-out sm:gap-3',
                            topBarScrolled
                                ? 'bg-background/70 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/55'
                                : 'bg-background',
                        )}
                    >
                        <SidebarTrigger className="min-h-[44px] min-w-[44px] shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {tenantTitle}
                        </span>
                        <DisplayChromeControls />
                    </header>

                    <div className="safe-px mx-auto w-full max-w-7xl pt-3 sm:pt-4">
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
                        <div className="safe-px mx-auto w-full max-w-7xl border-b border-border/80 pb-4 pt-2 sm:pb-6 sm:pt-2">
                            {header}
                        </div>
                    ) : null}

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
