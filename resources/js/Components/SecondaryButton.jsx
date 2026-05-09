/**
 * Boton secundario Everden (sistema unificado v1).
 *
 * Identidad:
 *  - Superficie tokenizada (bg-background/border-border/text-foreground).
 *  - Hover bg-muted (suave, neutro).
 *  - Anillo de foco unico esmeralda (--ring).
 *  - Sin uppercase: alineado con shadcn.
 */
const SIZE_CLASSES = {
    default:
        'inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold sm:min-h-0',
    touch:
        'inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform active:scale-[0.98]',
    'touch-lg':
        'inline-flex min-h-14 items-center justify-center rounded-lg px-7 py-3.5 text-base font-semibold transition-transform active:scale-[0.98]',
};

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    size = 'default',
    children,
    ...props
}) {
    const sizing = SIZE_CLASSES[size] ?? SIZE_CLASSES.default;

    return (
        <button
            {...props}
            type={type}
            data-size={size}
            className={
                `${sizing} border border-border bg-background text-foreground shadow-xs transition-colors duration-150 ease-in-out hover:bg-muted focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    disabled ? 'cursor-not-allowed opacity-40' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
