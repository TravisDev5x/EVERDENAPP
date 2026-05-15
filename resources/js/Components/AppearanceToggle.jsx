import { useAppearance } from '@/Contexts/AppearanceContext';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';

const cycle = ['system', 'light', 'dark'];

const labels = {
    system: 'Automático',
    light: 'Claro',
    dark: 'Oscuro',
};

function ThemeIcon({ theme }) {
    const common = 'size-[18px] shrink-0 stroke-[1.5]';
    if (theme === 'dark') {
        return <Moon className={common} aria-hidden />;
    }
    if (theme === 'light') {
        return <Sun className={common} aria-hidden />;
    }
    return <Monitor className={common} aria-hidden />;
}

export default function AppearanceToggle({ className = '' }) {
    const { theme, setTheme } = useAppearance();

    const rotate = () => {
        const i = cycle.indexOf(theme);
        const next = cycle[(i + 1) % cycle.length];
        setTheme(next);
    };

    const label = labels[theme] ?? theme;

    return (
        <button
            type="button"
            onClick={rotate}
            title={`Tema: ${label}. Clic para cambiar.`}
            aria-label={`Tema visual: ${label}. Pulsa para alternar entre automático, claro y oscuro.`}
            className={cn(
                'inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full',
                'text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'sm:min-h-9 sm:min-w-9',
                className,
            )}
        >
            <ThemeIcon theme={theme} />
        </button>
    );
}
