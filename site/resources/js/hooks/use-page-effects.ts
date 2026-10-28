import { useEffect, useState } from 'react';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Distance (px) between an element's center and the viewport's center.
const centerOffset = (el: Element) => {
    const r = el.getBoundingClientRect();

    return r.top + r.height / 2 - window.innerHeight / 2;
};

/**
 * True once the page is scrolled past the hero edge (the header gets its background).
 */
export function useScrolled(threshold = 40): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const update = () => setScrolled(window.scrollY > threshold);
        update();
        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, [threshold]);

    return scrolled;
}

/**
 * Parallax for [data-parallax] elements on the current page: hero media/content, world and lore backgrounds,
 * and the race portrait. Re-binds whenever `pageKey` changes (Inertia page visits).
 */
export function useParallax(pageKey: string): void {
    useEffect(() => {
        if (reduceMotion()) {
            return;
        }

        let ticking = false;
        const update = () => {
            const y = window.scrollY;
            const heroMedia = document.querySelector<HTMLElement>('[data-parallax="hero"]');
            const heroContent = document.querySelector<HTMLElement>('[data-parallax="hero-content"]');

            if (heroMedia && heroContent && y < window.innerHeight * 1.5) {
                heroMedia.style.transform = `translateY(${y * 0.4}px) scale(${1 + y * 0.0003})`;
                heroContent.style.transform = `translateY(${-y * 0.2}px)`;
                heroContent.style.opacity = String(Math.max(0, 1 - y / 600));
            }

            document.querySelectorAll<HTMLElement>('[data-parallax="world"]').forEach((bg) => {
                // Page-top heroes (lore, about, account) start unshifted and drift with the scroll; centring them on
                // the viewport would push short heroes' images down and show a black strip above them.
                const shift = bg.closest('.lore-hero') ? y * 0.25 : -centerOffset(bg.parentElement ?? bg) * 0.25;
                bg.style.transform = `translateY(${shift}px) scale(1.2)`;
            });

            const portrait = document.querySelector<HTMLElement>('.race-portrait');
            portrait?.style.setProperty('--race-shift', `${-centerOffset(portrait) * 0.05}px`);
        };
        const onScroll = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [pageKey]);
}

/**
 * Fades/slides `.reveal` elements in as they enter the viewport, including ones rendered later.
 */
export function useReveal(pageKey: string): void {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 },
        );
        const observeAll = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => observer.observe(el));
        const mutations = new MutationObserver(observeAll);

        observeAll();
        mutations.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutations.disconnect();
        };
    }, [pageKey]);
}

/**
 * Current time, ticking every second (for countdowns).
 */
export function useNow(intervalMs = 1000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}

/**
 * After an Inertia visit to a URL with a #hash, scroll to that section (or to the top).
 */
export function useHashScroll(pageKey: string): void {
    useEffect(() => {
        const hash = window.location.hash;

        if (!hash) {
            return;
        }

        requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView());
    }, [pageKey]);
}
