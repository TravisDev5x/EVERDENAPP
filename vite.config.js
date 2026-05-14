import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }
                    if (id.includes('react-dom') || id.includes('/react/')) {
                        return 'react-vendor';
                    }
                    if (id.includes('@inertiajs')) {
                        return 'inertia-vendor';
                    }
                    if (id.includes('lucide-react')) {
                        return 'icons-vendor';
                    }
                    if (id.includes('radix-ui') || id.includes('@radix-ui')) {
                        return 'radix-vendor';
                    }
                },
            },
        },
    },
});
