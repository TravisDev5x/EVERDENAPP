import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Campo de formulario Everden: Label + control (children) + error de validación.
 * El control debe usar el mismo `id` que se pasa al campo (p. ej. Input, SelectTrigger).
 */
export default function FormField({
    id,
    label,
    error,
    labelClassName,
    className,
    children,
}) {
    return (
        <div className={cn('space-y-2', className)}>
            {label != null && label !== '' ? (
                <Label htmlFor={id} className={labelClassName}>
                    {label}
                </Label>
            ) : null}
            {children}
            <InputError message={error} />
        </div>
    );
}

/** Alias para errores fuera de FormField (p. ej. checkboxes agrupados). */
export function FormFieldError({ message, className }) {
    return <InputError message={message} className={className} />;
}
