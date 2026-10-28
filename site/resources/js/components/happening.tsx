import { useId, useState } from 'react';
import { Divider } from '@/components/decor';
import { eventLore } from '@/data/event-lore';
import { useNow } from '@/hooks/use-page-effects';
import { languageTag, pick, useLocale, useT, type Locale, type Localized } from '@/i18n';
import type { EventFeed, GameEvent } from '@/types';

export const CATEGORY: Record<GameEvent['category'], Localized> = {
    epic: { en: 'Epic Boss', pt: 'Chefe Épico' },
    raid: { en: 'Raid Boss', pt: 'Raid Boss' },
    siege: { en: 'Castle Siege', pt: 'Cerco ao Castelo' },
    olympiad: { en: 'Olympiad', pt: 'Olimpíada' },
    event: { en: 'Event', pt: 'Evento' },
};
export const BADGE: Record<GameEvent['state'], Localized> = {
    live: { en: 'Live', pt: 'Ao vivo' },
    soon: { en: 'Soon', pt: 'Em breve' },
    scheduled: { en: 'Scheduled', pt: 'Agendado' },
    ready: { en: 'Awaits', pt: 'Aguarda' },
    slain: { en: 'Slain', pt: 'Derrotado' },
};

export const span = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d) {
        return `${d}d ${h}h`;
    }

    return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

const when = (iso: string, locale: Locale) =>
    new Date(iso).toLocaleString(languageTag(locale), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** What a card's countdown line says right now. */
export function countdown(e: GameEvent, now: number, locale: Locale = 'en'): string {
    const pt = locale === 'pt_BR';

    if (e.state === 'live') {
        return e.endsAt ? `${pt ? 'Termina em' : 'Ends in'} ${span(Date.parse(e.endsAt) - now)}` : pt ? 'Acontecendo agora' : 'Happening now';
    }

    if (e.startsAt) {
        const ms = Date.parse(e.startsAt) - now;

        return ms > 0 ? `${pt ? 'Começa em' : 'Starts in'} ${span(ms)} · ${when(e.startsAt, locale)}` : pt ? 'Começando agora' : 'Starting now';
    }

    if (e.returnsAt) {
        const ms = Date.parse(e.returnsAt) - now;

        return ms > 0 ? `${pt ? 'Retorna em' : 'Returns in'} ${span(ms)}` : pt ? 'Retornando agora' : 'Returning now';
    }

    return e.detail ?? '';
}

function EventCard({ event: e, featured, now }: { event: GameEvent; featured: boolean; now: number }) {
    const locale = useLocale();

    return (
        <article className={`event-card is-${e.state}${featured ? ' is-featured' : ''}`}>
            <div className="event-top">
                <span className={`event-badge badge-${e.state}`}>{pick(locale, BADGE[e.state])}</span>
                <span className="event-category">{pick(locale, CATEGORY[e.category])}</span>
            </div>
            <h3 className="event-title">
                {e.title}
                {e.level ? <span className="event-level"> Lv {e.level}</span> : null}
            </h3>
            <p className="event-place">{e.place}</p>
            <p className="event-headline">{e.headline}</p>
            {e.detail && (e.startsAt || e.returnsAt || e.state === 'live') ? <p className="event-detail">{e.detail}</p> : null}
            <p className="event-countdown">{countdown(e, now, locale)}</p>
            <EventMore event={e} />
        </article>
    );
}

/**
 * "Learn more" accordion: the lore behind the event and how it works on the server. The panel animates its height
 * (CSS grid rows 0fr -> 1fr, which works in every browser) and is inert while closed, so its link isn't tabbable.
 */
function EventMore({ event }: { event: GameEvent }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();
    const locale = useLocale();
    const t = useT();
    const lore = eventLore(event, locale);

    if (!lore) {
        return null;
    }

    return (
        <div className={`event-more${open ? ' is-open' : ''}`}>
            <button type="button" className="event-more-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
                <span>{open ? t('Show less', 'Mostrar menos') : t('Learn more', 'Saiba mais')}</span>
                <span className="event-more-chevron" aria-hidden="true"></span>
            </button>
            <div id={panelId} className="event-more-panel" role="region" aria-label={`${t('About', 'Sobre')} ${event.title}`} inert={!open}>
                <div className="event-more-clip">
                    <div className="event-more-body">
                        {lore.lore.map((paragraph) => (
                            <p key={paragraph} className="event-more-lore">
                                {paragraph}
                            </p>
                        ))}
                        <h4>{t('How it works', 'Como funciona')}</h4>
                        <ul>
                            {lore.howItWorks.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                        {lore.chapter ? (
                            <a className="event-more-link" href={lore.chapter.href}>
                                {t('Read the lore', 'Leia a história')}: {lore.chapter.label}
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * "Happening Now". Compact (landing page): only what is live right now, with a link to everything; the section is
 * hidden when nothing is live. Full (About page): every event, including scheduled ones and returning bosses.
 */
export function HappeningSection({ feed, mode }: { feed?: EventFeed | null; mode: 'compact' | 'full' }) {
    const now = useNow();
    const t = useT();
    const events = feed?.events ?? [];
    const shown = mode === 'full' ? events : events.filter((e) => e.state === 'live');

    if (mode === 'compact' && !shown.length) {
        return null;
    }

    return (
        <section id="happening" className="happening">
            <div className="container">
                <div className="section-head">
                    <p className="reveal kicker">{t('Live from the realm', 'Ao vivo do reino')}</p>
                    <h2 className="reveal section-title text-gold">{t('Happening Now', 'Acontecendo Agora')}</h2>
                    <Divider />
                    <p className="reveal lead happening-lead">
                        {mode === 'full'
                            ? t('Every boss, siege, contest and event on the server, updated live.', 'Todos os chefes, cercos, disputas e eventos do servidor, atualizados ao vivo.')
                            : t(
                                  'Dragons stir, castles fall and heroes rise. This is what is unfolding in Aden right now.',
                                  'Dragões se agitam, castelos caem e heróis se erguem. É isto que está acontecendo em Aden agora.',
                              )}
                    </p>
                </div>
                <div className="events-list" aria-live="polite">
                    {!feed ? <p className="about-empty">{t('Live events are unavailable right now.', 'Os eventos ao vivo estão indisponíveis no momento.')}</p> : null}
                    {feed && !shown.length ? <p className="about-empty">{t('The realm is quiet. Check back soon.', 'O reino está calmo. Volte em breve.')}</p> : null}
                    {shown.map((e, i) => (
                        <EventCard key={e.id} event={e} featured={i === 0 && e.state === 'live'} now={now} />
                    ))}
                </div>
                {mode === 'compact' ? (
                    <div className="reveal actions happening-actions">
                        <a href="/about#happening" className="btn btn-outline">{t('All Events & Bosses', 'Todos os Eventos e Chefes')}</a>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

/** "● LIVE NOW · Castle Siege" pill for the landing hero, only while something is live. */
export function LivePill({ feed }: { feed?: EventFeed | null }) {
    const live = feed?.events.filter((e) => e.state === 'live') ?? [];
    const t = useT();

    if (!live.length) {
        return null;
    }

    return (
        <a href="#happening" className="live-pill">
            <span className="pill-dot is-live"></span>
            <span className="pill-label">{t('Live now', 'Ao vivo')}</span>
            <span className="pill-text">{live.length > 1 ? `${live[0].title} +${live.length - 1} ${t('more', 'mais')}` : live[0].title}</span>
        </a>
    );
}
