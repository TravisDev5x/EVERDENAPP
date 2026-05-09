/**
 * Alerta operativa Everden v1.
 * Variants tokenizadas: info usa la marca (Verde Bosque suave), warning ambar
 * y error el destructive shadcn.
 */
const VARIANTS = {
    info: 'border-primary/20 bg-secondary text-secondary-foreground',
    warning:
        'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100',
    error:
        'border-destructive/30 bg-destructive/10 text-destructive',
};

export default function EvOperationalAlert({
    title,
    description,
    variant = 'info',
    action = null,
    onDismiss = null,
}) {
    const tone = VARIANTS[variant] ?? VARIANTS.info;

    return (
        <div
            role={variant === 'error' ? 'alert' : 'status'}
            className={`flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm shadow-xs sm:flex-row sm:items-start sm:justify-between ${tone}`}
        >
            <div className="min-w-0">
                {title ? <p className="font-semibold leading-tight">{title}</p> : null}
                {description ? (
                    <p className="mt-0.5 text-xs leading-relaxed opacity-90">{description}</p>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {action}
                {onDismiss ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="rounded-md px-2 py-1 text-xs font-medium underline-offset-2 hover:underline focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        Cerrar
                    </button>
                ) : null}
            </div>
        </div>
    );
}
