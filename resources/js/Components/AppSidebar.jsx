import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarAccountMenu from '@/Components/SidebarAccountMenu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/Components/ui/sidebar';
import { Link } from '@inertiajs/react';
import {
    ArrowLeftRight,
    BarChart3,
    Building2,
    Coins,
    KeyRound,
    Landmark,
    LayoutDashboard,
    LockKeyhole,
    Package,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Tags,
    TrendingUp,
    Users,
} from 'lucide-react';

function NavLink({ href, active, label, icon: Icon }) {
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={active} tooltip={label}>
                <Link href={href} onClick={() => setOpenMobile(false)} preserveScroll>
                    <Icon />
                    <span>{label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function AppSidebar({
    tenantTitle,
    user,
    isPlatformOperator,
    canViewTeamUsers,
    canViewTeamRoles,
    canViewBranches,
    canViewCustody,
}) {
    const { setOpenMobile } = useSidebar();

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Borde en la fila h-14: si va en SidebarHeader, el bloque mide 56px + borde y no coincide con el header del inset (h-14 incluye borde). */}
            <SidebarHeader className="gap-0 p-0">
                <div className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-border px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-800 shadow-md shadow-emerald-900/20 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 dark:from-emerald-600 dark:via-teal-600 dark:to-green-900">
                        <ApplicationLogo className="block h-7 w-auto max-h-full max-w-full fill-white opacity-95 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-auto" />
                    </div>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-sm font-semibold text-sidebar-foreground">
                            {tenantTitle}
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {isPlatformOperator ? (
                    <SidebarGroup>
                        <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <NavLink
                                    href={route('platform.tenants.index')}
                                    active={
                                        route().current('platform.tenants.index') ||
                                        route().current('platform.tenants.users')
                                    }
                                    label="Negocios"
                                    icon={Building2}
                                />
                                <NavLink
                                    href={route('platform.finance.plans')}
                                    active={route().current('platform.finance.plans')}
                                    label="Planes e ingresos"
                                    icon={TrendingUp}
                                />
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <>
                        <SidebarGroup>
                            <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <NavLink
                                        href={route('dashboard')}
                                        active={route().current('dashboard')}
                                        label="Menú"
                                        icon={LayoutDashboard}
                                    />
                                    <NavLink
                                        href={route('inventory.page')}
                                        active={route().current('inventory.page')}
                                        label="Inventario"
                                        icon={Package}
                                    />
                                    <NavLink
                                        href={route('products.page')}
                                        active={route().current('products.page')}
                                        label="Catálogo"
                                        icon={ShoppingBag}
                                    />
                                    <NavLink
                                        href={route('product-categories.page')}
                                        active={route().current('product-categories.page')}
                                        label="Categorías"
                                        icon={Tags}
                                    />
                                    <NavLink
                                        href={route('sales.page')}
                                        active={route().current('sales.page')}
                                        label="Ventas"
                                        icon={ShoppingCart}
                                    />
                                    <NavLink
                                        href={route('branches.page')}
                                        active={route().current('branches.page')}
                                        label="Ubicaciones"
                                        icon={Building2}
                                    />
                                    {canViewBranches ? (
                                        <NavLink
                                            href={route('cash-registers.page')}
                                            active={route().current('cash-registers.page')}
                                            label="Cajas"
                                            icon={Landmark}
                                        />
                                    ) : null}
                                    <NavLink
                                        href={route('inventory.transfers.page')}
                                        active={route().current('inventory.transfers.page')}
                                        label="Transferencias"
                                        icon={ArrowLeftRight}
                                    />
                                    <NavLink
                                        href={route('reports.daily')}
                                        active={route().current('reports.daily')}
                                        label="Reporte diario"
                                        icon={BarChart3}
                                    />
                                    <NavLink
                                        href={route('finance.page')}
                                        active={route().current('finance.page')}
                                        label="Cuentas"
                                        icon={Coins}
                                    />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {canViewCustody ? (
                                        <NavLink
                                            href={route('customers.custody.page')}
                                            active={route().current('customers.custody.page')}
                                            label="Custodia"
                                            icon={LockKeyhole}
                                        />
                                    ) : null}
                                    {canViewTeamUsers ? (
                                        <NavLink
                                            href={route('team.users.page')}
                                            active={route().current('team.users.page')}
                                            label="Equipo"
                                            icon={Users}
                                        />
                                    ) : null}
                                    {canViewTeamRoles ? (
                                        <NavLink
                                            href={route('team.roles.page')}
                                            active={route().current('team.roles.page')}
                                            label="Accesos"
                                            icon={KeyRound}
                                        />
                                    ) : null}
                                    <NavLink
                                        href={route('tenant.profile.edit')}
                                        active={route().current('tenant.profile.edit')}
                                        label="Mi negocio"
                                        icon={Building2}
                                    />
                                    <NavLink
                                        href={route('profile.edit')}
                                        active={route().current('profile.edit')}
                                        label="Configuración"
                                        icon={Settings}
                                    />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-3 py-2 group-data-[collapsible=icon]:px-0">
                <SidebarAccountMenu user={user} onNavigate={() => setOpenMobile(false)} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
