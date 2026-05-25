/**
 * Aberden — monograma "E" geométrico.
 * Usa `currentColor` por defecto cuando se aplica `fill-*` desde className.
 */
export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Aberden"
        >
            {/* Vertical izquierda */}
            <rect x="10" y="10" width="8" height="44" rx="2" />
            {/* Barra superior */}
            <rect x="18" y="10" width="36" height="8" rx="2" />
            {/* Barra media */}
            <rect x="18" y="28" width="28" height="8" rx="2" />
            {/* Barra inferior */}
            <rect x="18" y="46" width="36" height="8" rx="2" />
        </svg>
    );
}
