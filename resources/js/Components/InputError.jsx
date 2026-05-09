/**
 * Mensaje de error Everden tokenizado (variante destructive de shadcn).
 */
export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'text-sm font-medium text-destructive ' + className}
        >
            {message}
        </p>
    ) : null;
}
