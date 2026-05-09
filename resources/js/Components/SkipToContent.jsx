/**
 * Primer foco al usar Tab: lleva al contenido principal (WCAG 2.4.1).
 */
export default function SkipToContent({ targetId = 'main-content' }) {
    const handleClick = (e) => {
        const el = document.getElementById(targetId);
        if (el) {
            e.preventDefault();
            el.focus({ preventScroll: true });
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className={
                'fixed left-4 top-0 z-[100] -translate-y-full rounded-b-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg ' +
                'transition-transform duration-200 ease-out ' +
                'focus:translate-y-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600'
            }
        >
            Saltar al contenido
        </a>
    );
}
