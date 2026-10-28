import { useEffect, useMemo, useRef, useState } from 'react';

/** The small gold line-diamond-line divider under section titles. */
export function Divider() {
    return (
        <div className="divider" aria-hidden="true">
            <span></span>
            <span className="diamond"></span>
            <span></span>
        </div>
    );
}

/** Glowing embers floating up over a hero. */
export function Embers({ count = 28 }: { count?: number }) {
    const embers = useMemo(
        () =>
            Array.from({ length: count }, () => {
                const size = 2 + Math.random() * 3;

                return {
                    left: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${8 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 10}s`,
                };
            }),
        [count],
    );

    return (
        <div className="embers" aria-hidden="true">
            {embers.map((style, i) => (
                <span key={i} className="ember" style={style}></span>
            ))}
        </div>
    );
}

/**
 * Background video that only loads and plays once its section is about to scroll into view
 * (saves the download on first load). Skipped entirely for reduced-motion visitors.
 */
export function LazyVideo({ src }: { src: string }) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = ref.current;

        if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    video.src = src;
                    video.play().catch(() => {});
                    observer.disconnect();
                }
            },
            { rootMargin: '600px 0px' },
        );
        observer.observe(video);

        return () => observer.disconnect();
    }, [src]);

    return <video ref={ref} muted loop playsInline preload="none"></video>;
}

/**
 * Looping background video for a page-top hero (About, Account), inside the parallax layer. The poster shows while
 * it loads; visitors who prefer reduced motion only get the poster.
 */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
    const ref = useRef<HTMLVideoElement>(null);
    const [animate, setAnimate] = useState(false);

    useEffect(() => setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);

    // The source is only set after mount, when autoplay may already have been evaluated: start it explicitly.
    useEffect(() => {
        if (animate) {
            ref.current?.play().catch(() => {});
        }
    }, [animate]);

    return (
        <div className="lore-hero-bg hero-video-bg" data-parallax="world">
            <video ref={ref} src={animate ? src : undefined} poster={poster} autoPlay={animate} muted loop playsInline preload={animate ? 'auto' : 'none'}></video>
        </div>
    );
}
