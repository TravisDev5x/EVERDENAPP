import { Link } from '@inertiajs/react';

/**
 * Paginación Inertia + Laravel LengthAwarePaginator (estructura plana o con meta).
 */
export default function Pagination({ resource, className = '' }) {
    if (!resource) {
        return null;
    }

    const lastPage = resource.last_page ?? resource.meta?.last_page ?? 1;
    if (lastPage <= 1) {
        return null;
    }

    const meta = resource.meta ?? resource;
    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const total = meta.total ?? 0;
    const links = resource.links ?? [];

    return (
        <div
            className={
                'flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between ' +
                className
            }
        >
            <p className="text-sm text-gray-600 dark:text-slate-400">
                Mostrando{' '}
                <span className="font-medium text-gray-900 dark:text-slate-100">
                    {from}-{to}
                </span>{' '}
                de <span className="font-medium">{total}</span>
            </p>
            <nav className="flex flex-wrap gap-1" aria-label="Paginación">
                {(links ?? []).map((link, i) =>
                    link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={
                                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 py-2 text-sm transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 sm:min-h-0 sm:min-w-0 sm:py-1.5 ' +
                                (link.active
                                    ? 'bg-indigo-600 font-semibold text-white dark:bg-indigo-500'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600')
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={i}
                            className="rounded-md px-3 py-1.5 text-sm text-gray-400 dark:text-slate-500"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}
