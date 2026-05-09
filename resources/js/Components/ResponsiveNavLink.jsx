import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[44px] w-full items-center border-l-4 py-2 pe-4 ps-3 sm:min-h-0 ${
                active
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 focus:border-indigo-700 focus:bg-indigo-100 focus:text-indigo-800 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200 dark:focus:bg-indigo-950/60'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 ${className}`}
        >
            {children}
        </Link>
    );
}
