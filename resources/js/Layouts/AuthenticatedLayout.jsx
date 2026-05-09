import AppSidebar from '@/Components/AppSidebar';
import AppearanceToggle from '@/Components/AppearanceToggle';
import SkipToContent from '@/Components/SkipToContent';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

function MobileSidebarBridge() {
    const page = usePage();
    const { setOpenMobile } = useSidebar();

    useEffect(() => {
        setOpenMobile(false);
    }, [page.url, setOpenMobile]);

    return null;
}

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const user = props.auth.user;
    const isPlatformOperator = props.auth.isPlatformOperator ?? false;
    const permissionKeys = props.auth.permissionKeys ?? [];
    const canViewTeamUsers = permissionKeys.includes('team.users.view');
    const canViewTeamRoles = permissionKeys.includes('team.roles.view');
    const canViewBranches = permissionKeys.includes('branches.view');
    const canViewCustody = permissionKeys.includes('customer-custody.view');
    const tenantTitle = props.tenant?.name ?? 'Tu tienda';
    const flash = props.flash ?? {};

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
                        'bg-background outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
                    )}
                >
                    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
                        <SidebarTrigger className="min-h-[44px] min-w-[44px] shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {tenantTitle}
                        </span>
                        <AppearanceToggle />
                    </header>

                    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
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
                        <div className="mx-auto max-w-7xl border-b border-border/80 px-4 pb-6 pt-2 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    ) : null}

                    {children}
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
