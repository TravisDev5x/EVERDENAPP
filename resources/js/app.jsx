import '../css/app.css';
import './bootstrap';

import { AppearanceProvider } from '@/Contexts/AppearanceContext';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'EVERDEN';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppearanceProvider>
                <App {...props} />
            </AppearanceProvider>,
        );
    },
    progress: {
        color: '#6366f1',
    },
});
