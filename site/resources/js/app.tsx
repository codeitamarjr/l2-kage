import { createInertiaApp } from '@inertiajs/react';
import SiteLayout from '@/layouts/site-layout';

createInertiaApp({
    // Pages pass their full title (the "seo" prop, see the site layout).
    title: (title) => title || 'L2 Kage',
    layout: () => SiteLayout,
    strictMode: true,
    progress: {
        color: '#d4a94f',
    },
});
