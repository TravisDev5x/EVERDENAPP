import Dropdown from '@/Components/Dropdown';
import { useAppearance } from '@/Contexts/AppearanceContext';
import { Link } from '@inertiajs/react';

const themeCycle = ['system', 'light', 'dark'];

const themeLabels = {
    system: 'Automático',
    light: 'Claro',
    dark: 'Oscuro',
};

function IconChevronUpDown({ className = '' }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`h-4 w-4 shrink-0 text-muted-foreground ${className}`}
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
    );
}

function IconCogMenu({ className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 shrink-0 ${className}`} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
}

function IconSunMenu({ className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 shrink-0 ${className}`} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
    );
}

function IconLogoutMenu({ className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 shrink-0 ${className}`} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12h-12m10.5 0 3-3m-3 3 3 3" />
        </svg>
    );
}

const menuRow =
    'flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm text-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/35';

export default function SidebarAccountMenu({ user, onNavigate }) {
    const { theme, setTheme } = useAppearance();

    const rotateTheme = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const i = themeCycle.indexOf(theme);
        setTheme(themeCycle[(i + 1) % themeCycle.length]);
    };

    return (
        <div className="relative z-20 overflow-visible">
            <Dropdown>
                <Dropdown.Trigger>
                    <button
                        type="button"
                        id="sidebar-account-menu-button"
                        className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-sidebar p-2 text-left hover:bg-sidebar focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-1.5"
                        aria-haspopup="menu"
                    >
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:text-[0.65rem]"
                            aria-hidden
                        >
                            {(user.name?.slice(0, 2) ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-sm font-semibold text-sidebar-foreground">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
                        </div>
                        <IconChevronUpDown className="group-data-[collapsible=icon]:hidden" />
                    </button>
                </Dropdown.Trigger>
                <Dropdown.Content
                    align="left"
                    width="56"
                    placement="top"
                    contentClasses="overflow-hidden rounded-xl border border-border bg-popover py-0 text-popover-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10"
                >
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="py-1">
                        <Link
                            href={route('profile.edit')}
                            role="menuitem"
                            className={menuRow}
                            onClick={() => onNavigate?.()}
                        >
                            <IconCogMenu className="text-muted-foreground" />
                            Configuración
                        </Link>
                        <button
                            type="button"
                            role="menuitem"
                            className={menuRow}
                            onClick={rotateTheme}
                            title="Cambiar tema visual"
                            aria-label={`Apariencia: ${themeLabels[theme] ?? theme}. Clic para alternar.`}
                        >
                            <IconSunMenu className="text-muted-foreground" />
                            <span className="flex-1">Apariencia</span>
                            <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                {themeLabels[theme] ?? theme}
                            </span>
                        </button>
                    </div>
                    <div className="border-t border-border py-1">
                        <Dropdown.Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className={`${menuRow} !flex items-center gap-3 text-foreground`}
                            onClick={() => onNavigate?.()}
                        >
                            <IconLogoutMenu className="text-muted-foreground" />
                            Cerrar sesión
                        </Dropdown.Link>
                    </div>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );
}
