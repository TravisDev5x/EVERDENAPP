/**
 * Etiqueta de input Everden (sistema unificado v1).
 * Tokenizada para light/dark; sin clases hardcoded.
 */
export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-foreground/80 ` + className
            }
        >
            {value ? value : children}
        </label>
    );
}
