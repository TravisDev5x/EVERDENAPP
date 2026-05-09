/**
 * Boton destructivo Everden (sistema unificado v1).
 * Usa el token --destructive para mantener coherencia con shadcn Button
 * variant="destructive" y respetar dark mode automaticamente.
 */
export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex min-h-[44px] items-center justify-center rounded-lg border border-transparent bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-xs transition-colors duration-150 ease-in-out hover:bg-destructive/90 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-destructive sm:min-h-0 ${
                    disabled ? 'cursor-not-allowed opacity-40' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
