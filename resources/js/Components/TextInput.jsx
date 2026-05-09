import { cn } from '@/lib/utils';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Input legacy Breeze migrado al sistema Everden v1.
 *  - Bordes y fondo tokenizados (border-border / bg-background).
 *  - Foco unico Esmeralda (--ring).
 *  - Touch-First (size="touch") sin alterar consumidores existentes.
 */
const SIZE_CLASSES = {
    default:
        'min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 shadow-xs sm:min-h-0',
    touch:
        'min-h-12 rounded-lg border border-border bg-background px-3.5 py-3 text-base shadow-xs',
};

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, size = 'default', ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const sizing = SIZE_CLASSES[size] ?? SIZE_CLASSES.default;

    return (
        <input
            {...props}
            type={type}
            data-size={size}
            className={cn(
                sizing,
                'text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-hidden focus:ring-3 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            ref={localRef}
        />
    );
});
