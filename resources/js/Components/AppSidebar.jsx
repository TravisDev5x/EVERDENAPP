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
} from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    Coins,
    KeyRound,
    Landmark,
    LayoutDashboard,
    LockKeyhole,
    Package,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
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
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex h-14 shrink-0 items-center gap-3 px-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-200">
                        <ApplicationLogo className="block h-7 w-auto fill-white opacity-95" />
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
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <NavLink
                                    href={route('platform.tenants.index')}
                                    active={route().current('platform.tenants.index')}
                                    label="Plataforma"
                                    icon={Building2}
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
                                        href={route('reports.daily')}
                                        active={route().current('reports.daily')}
                                        label="Actividad del día"
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
                                    <NavLink
                                        href={route('reports.daily')}
                                        active={route().current('reports.daily')}
                                        label="Auditoría"
                                        icon={Shield}
                                    />
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

            <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
                <SidebarAccountMenu user={user} onNavigate={() => setOpenMobile(false)} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
