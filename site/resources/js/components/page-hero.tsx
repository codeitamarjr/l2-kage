import type { ReactNode } from 'react';
import { Divider, Embers, HeroVideo } from '@/components/decor';

type PageHeroProps = {
    kicker: string;
    title: ReactNode;
    tagline: ReactNode;
    /** Looping background video; without it the hero uses the default image (hero.jpg) from the stylesheet. */
    video?: { src: string; poster: string };
    /** Extra class for per-page tuning (e.g. "about-hero": background brightness, overlay). */
    className?: string;
    /** Extra lines under the tagline (e.g. the About page's "Updated ..."). */
    children?: ReactNode;
};

/**
 * The page-top banner shared by Lore, About and Map: same height (70% of the screen), padding, typography, overlay,
 * embers and parallax. Account still has its own shorter banner.
 */
export default function PageHero({ kicker, title, tagline, video, className, children }: PageHeroProps) {
    return (
        <section className={className ? `lore-hero ${className}` : 'lore-hero'}>
            {video ? <HeroVideo src={video.src} poster={video.poster} /> : <div className="lore-hero-bg" data-parallax="world"></div>}
            <div className="lore-hero-shade"></div>
            <Embers />
            <div className="lore-hero-content">
                <p className="hero-kicker">{kicker}</p>
                <h1 className="lore-title text-gold">{title}</h1>
                <Divider />
                <p className="hero-tagline">{tagline}</p>
                {children}
            </div>
        </section>
    );
}
