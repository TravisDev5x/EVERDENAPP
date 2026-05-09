import { useAppearance } from '@/Contexts/AppearanceContext';

const cycle = ['system', 'light', 'dark'];

const labels = {
    system: 'Automático',
    light: 'Claro',
    dark: 'Oscuro',
};

export default function AppearanceToggle({ className = '' }) {
    const { theme, setTheme } = useAppearance();

    const rotate = () => {
        const i = cycle.indexOf(theme);
        const next = cycle[(i + 1) % cycle.length];
        setTheme(next);
    };

    return (
        <button
            type="button"
            onClick={rotate}
            title={`Tema: ${labels[theme] ?? theme}. Clic para cambiar.`}
            aria-label={`Tema visual: ${labels[theme] ?? theme}. Pulsa para alternar entre automático, claro y oscuro.`}
            className={
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ' +
                'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 ' +
                'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
                'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900 ' +
                'sm:min-h-0 sm:min-w-0 ' +
                className
            }
        >
            <span className="hidden sm:inline">{labels[theme] ?? theme}</span>
            <span className="text-base leading-none" aria-hidden="true">
                {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
            </span>
        </button>
    );
}
