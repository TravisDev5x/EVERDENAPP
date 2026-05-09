/**
 * Etiqueta de input Everden (sistema unificado v1).
 * Tokenizada para light/dark; sin clases hardcoded.
 */
import { cn } from '@/lib/utils';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={cn('block text-sm font-medium text-foreground/80', className)}
        >
            {value ? value : children}
        </label>
    );
}
