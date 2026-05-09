import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'appearance';

const AppearanceContext = createContext(null);

function applyThemeClass(theme) {
    if (typeof window === 'undefined') {
        return;
    }
    let dark = false;
    if (theme === 'dark') {
        dark = true;
    } else if (theme === 'light') {
        dark = false;
    } else {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark', dark);
}

export function AppearanceProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') {
            return 'system';
        }
        try {
            return localStorage.getItem(STORAGE_KEY) || 'system';
        } catch {
            return 'system';
        }
    });

    const setTheme = useCallback((value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch {
            /* ignore */
        }
        setThemeState(value);
    }, []);

    useEffect(() => {
        applyThemeClass(theme);
        if (theme !== 'system') {
            return undefined;
        }
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyThemeClass('system');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

    return (
        <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const ctx = useContext(AppearanceContext);
    if (!ctx) {
        throw new Error('useAppearance debe usarse dentro de AppearanceProvider');
    }
    return ctx;
}
