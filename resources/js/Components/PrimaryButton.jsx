/**
 * Boton primario Everden (sistema unificado v1).
 *
 * Identidad:
 *  - Verde Bosque (--primary) como color institucional.
 *  - Esmeralda (--ring) como anillo de foco unico para todo el sistema.
 *  - Tipografia minuscula con peso semibold (alineada con shadcn).
 *
 * Touch-First (Fase 1):
 *  - Sin `size`: comportamiento estandar para escritorio.
 *  - size="touch":    48px alto + active:scale.
 *  - size="touch-lg": 56px alto + active:scale (CTA primarios POS).
 */
const SIZE_CLASSES = {
    default:
        'inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold sm:min-h-0',
    touch:
        'inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform active:scale-[0.98]',
    'touch-lg':
        'inline-flex min-h-14 items-center justify-center rounded-lg px-7 py-3.5 text-base font-semibold transition-transform active:scale-[0.98]',
};

export default function PrimaryButton({
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
            data-size={size}
            className={
                `${sizing} border border-transparent bg-primary text-primary-foreground shadow-xs transition-colors duration-150 ease-in-out hover:bg-primary/90 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-primary/95 ${
                    disabled ? 'cursor-not-allowed opacity-40' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
