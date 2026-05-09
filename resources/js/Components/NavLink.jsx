import { Link } from '@inertiajs/react';

/**
 * Tab/NavLink horizontal Everden v1.
 * - Indicador activo Bosque (border-primary).
 * - Foco unico Esmeralda (--ring).
 */
export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            aria-current={active ? 'page' : undefined}
            className={
                'inline-flex shrink-0 scroll-m-1 items-center whitespace-nowrap border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out focus:outline-hidden focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
                (active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground') +
                ' ' +
                className
            }
        >
            {children}
        </Link>
    );
}
