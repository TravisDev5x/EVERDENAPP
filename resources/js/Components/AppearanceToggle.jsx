import { useAppearance } from '@/Contexts/AppearanceContext';
import { displayChromeButtonClass } from '@/lib/display-chrome';
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
            className={cn(displayChromeButtonClass, className)}
        >
            <ThemeIcon theme={theme} />
        </button>
    );
}
