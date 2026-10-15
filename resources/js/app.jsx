import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = 'SILAP-Kinerja';

// Support both Inertia v1 (data-page on div) and Inertia v2 (script[data-page="app"])
const appEl = typeof document !== 'undefined' ? document.getElementById('app') : null;
const scriptEl = typeof document !== 'undefined' ? document.querySelector('script[data-page="app"]') : null;
let initialPage = undefined;

if (scriptEl && scriptEl.textContent) {
    try {
        initialPage = JSON.parse(scriptEl.textContent);
        if (appEl && !appEl.dataset.page) {
            appEl.dataset.page = scriptEl.textContent;
        }
    } catch (e) {
        console.error('Failed to parse Inertia script data-page:', e);
    }
}

createInertiaApp({
    title: (title) => title && title !== 'SILAP-Kinerja' ? `${title} | SILAP-Kinerja` : 'SILAP-Kinerja',
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    page: initialPage,
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#0284c7',
    },
});
