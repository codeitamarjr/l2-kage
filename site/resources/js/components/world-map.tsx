import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { BADGE, CATEGORY, countdown, span } from '@/components/happening';
import { Pumpkin } from '@/components/news';
import { eventLore } from '@/data/event-lore';
import { landmarkLore, nearestLandmark } from '@/data/world-map';
import { pick, useLocale, useT, type Localized } from '@/i18n';
import { useNow } from '@/hooks/use-page-effects';
import type { EventFeed, GameEvent, MapPoint, RaidPin, WorldMapData } from '@/types';

type Layer = GameEvent['category'];

const LAYERS: { key: Layer; label: Localized }[] = [
    { key: 'epic', label: { en: 'Epic bosses', pt: 'Chefes épicos' } },
    { key: 'raid', label: { en: 'Raid bosses', pt: 'Raid bosses' } },
    { key: 'siege', label: { en: 'Castle sieges', pt: 'Cercos aos castelos' } },
    { key: 'olympiad', label: { en: 'Olympiad', pt: 'Olimpíada' } },
    { key: 'event', label: { en: 'Events', pt: 'Eventos' } },
];

/** Small line icons for the event markers (24 x 24, stroked). */
const ICONS: Record<Exclude<Layer, 'raid'>, ReactNode> = {
    epic: <path d="M3 18h18l-1.6-10-4.6 4.2L12 5l-2.8 7.2L4.6 8z" />,
    siege: <path d="M6 21V3m0 1h11l-2.5 4 2.5 4H6" />,
    olympiad: <path d="M8 4h8v5a4 4 0 0 1-8 0zm4 9v4m-4 3h8M8 6H5a3 3 0 0 0 3.4 4M16 6h3a3 3 0 0 1-3.4 4" />,
    event: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z" />,
};

const MAX_ZOOM = 5;
const FOCUS_ZOOM = 2.6;

/** Pan and zoom, as fractions of the frame: the map is scaled by s and moved by (x, y) frame widths/heights. */
type View = { s: number; x: number; y: number };

type Selection = { kind: 'event'; id: string; point: number } | { kind: 'raid'; id: number };

const clampView = ({ s, x, y }: View): View => {
    const scale = Math.min(MAX_ZOOM, Math.max(1, s));

    return { s: scale, x: Math.min(0, Math.max(1 - scale, x)), y: Math.min(0, Math.max(1 - scale, y)) };
};

/** Zoom by factor around a point of the frame (fractions), keeping that point still. */
const zoomAround = (view: View, factor: number, fx: number, fy: number): View => {
    const s = Math.min(MAX_ZOOM, Math.max(1, view.s * factor));

    return clampView({ s, x: fx - ((fx - view.x) * s) / view.s, y: fy - ((fy - view.y) * s) / view.s });
};

/** Where a map point (percent of the image) is placed in the overlay; the CSS turns it into a position. */
const pinStyle = (point: { x: number; y: number }): CSSProperties => ({ '--mx': point.x / 100, '--my': point.y / 100 }) as CSSProperties;

/**
 * Pan/zoom for the map frame: drag (or one finger once zoomed in), pinch, Ctrl/Cmd + wheel (also trackpad pinch),
 * double click, the +/- buttons and the keyboard. Programmatic moves animate ("smooth"); direct manipulation doesn't.
 */
function usePanZoom() {
    const frameRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
    const [smooth, setSmooth] = useState(false);
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const dragged = useRef(false);
    const start = useRef<{ x: number; y: number } | null>(null);

    const frameFraction = useCallback((clientX: number, clientY: number) => {
        const rect = frameRef.current!.getBoundingClientRect();

        return { fx: (clientX - rect.left) / rect.width, fy: (clientY - rect.top) / rect.height, rect };
    }, []);

    const animateTo = useCallback((next: (view: View) => View) => {
        setSmooth(true);
        setView((current) => next(current));
    }, []);

    // Wheel needs a non-passive listener to stop the page zooming; plain scrolling still scrolls the page.
    useEffect(() => {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }

            e.preventDefault();
            const { fx, fy } = frameFraction(e.clientX, e.clientY);
            setSmooth(false);
            setView((current) => zoomAround(current, Math.exp(-e.deltaY * 0.01), fx, fy));
        };
        frame.addEventListener('wheel', onWheel, { passive: false });

        return () => frame.removeEventListener('wheel', onWheel);
    }, [frameFraction]);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        start.current = { x: e.clientX, y: e.clientY };
        dragged.current = false;
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const previous = pointers.current.get(e.pointerId);

        if (!previous) {
            return;
        }

        const others = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (!dragged.current && start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) < 5) {
            return;
        }

        if (!dragged.current) {
            dragged.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        const { rect } = frameFraction(e.clientX, e.clientY);
        setSmooth(false);

        if (others.length === 1) {
            // Pinch: zoom by the change in finger distance around their midpoint, and follow the midpoint.
            const other = others[0];
            const before = Math.hypot(previous.x - other.x, previous.y - other.y);
            const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
            const fx = ((e.clientX + other.x) / 2 - rect.left) / rect.width;
            const fy = ((e.clientY + other.y) / 2 - rect.top) / rect.height;
            setView((current) => {
                const zoomed = zoomAround(current, before ? after / before : 1, fx, fy);

                return clampView({ ...zoomed, x: zoomed.x + (e.clientX - previous.x) / 2 / rect.width, y: zoomed.y + (e.clientY - previous.y) / 2 / rect.height });
            });

            return;
        }

        setView((current) => clampView({ ...current, x: current.x + (e.clientX - previous.x) / rect.width, y: current.y + (e.clientY - previous.y) / rect.height }));
    };

    const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
        pointers.current.delete(e.pointerId);
    };

    const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, .worldmap-popover')) {
            return;
        }

        const { fx, fy } = frameFraction(e.clientX, e.clientY);
        animateTo((current) => zoomAround(current, 2, fx, fy));
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) {
            return;
        }

        const step = 0.1;
        const moves: Record<string, (v: View) => View> = {
            ArrowLeft: (v) => clampView({ ...v, x: v.x + step }),
            ArrowRight: (v) => clampView({ ...v, x: v.x - step }),
            ArrowUp: (v) => clampView({ ...v, y: v.y + step }),
            ArrowDown: (v) => clampView({ ...v, y: v.y - step }),
            '+': (v) => zoomAround(v, 1.5, 0.5, 0.5),
            '=': (v) => zoomAround(v, 1.5, 0.5, 0.5),
            '-': (v) => zoomAround(v, 1 / 1.5, 0.5, 0.5),
            '0': () => ({ s: 1, x: 0, y: 0 }),
        };

        if (moves[e.key]) {
            e.preventDefault();
            animateTo(moves[e.key]);
        }
    };

    return {
        frameRef,
        view,
        smooth,
        wasDrag: () => dragged.current,
        zoomBy: (factor: number) => animateTo((v) => zoomAround(v, factor, 0.5, 0.5)),
        reset: () => animateTo(() => ({ s: 1, x: 0, y: 0 })),
        /** Center the map on a point (percent of the image), zooming in if needed. */
        focus: (point: { x: number; y: number }) =>
            animateTo((v) => {
                const s = Math.max(v.s, FOCUS_ZOOM);

                return clampView({ s, x: 0.5 - (point.x / 100) * s, y: 0.5 - (point.y / 100) * s });
            }),
        handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onDoubleClick, onKeyDown },
    };
}

function Popover({ view, point, onClose, children }: { view: View; point: { x: number; y: number }; onClose: () => void; children: ReactNode }) {
    // Open below the marker in the top half of the frame, above it in the bottom half.
    const below = view.y + (point.y / 100) * view.s < 0.5;
    const t = useT();

    return (
        <div className={`worldmap-popover ${below ? 'is-below' : 'is-above'}`} style={pinStyle(point)} role="dialog" aria-label={t('Map details', 'Detalhes do mapa')}>
            <button type="button" className="worldmap-popover-close" onClick={onClose} aria-label={t('Close', 'Fechar')}>
                ×
            </button>
            {children}
        </div>
    );
}

/** The Halloween event: its markers are pumpkins. */
const PUMPKIN_EVENT = 'event-SquashEvent';

function EventDetails({ event: e, point, now }: { event: GameEvent; point: MapPoint; now: number }) {
    const locale = useLocale();
    const t = useT();
    const lore = eventLore(e, locale);
    const story = landmarkLore(point.name, locale) ?? lore?.lore[0];

    return (
        <>
            <div className="event-top">
                <span className={`event-badge badge-${e.state}`}>{pick(locale, BADGE[e.state])}</span>
                <span className="event-category">{pick(locale, CATEGORY[e.category])}</span>
            </div>
            <h3 className="worldmap-popover-title">
                {e.title}
                {e.level ? <span className="event-level"> Lv {e.level}</span> : null}
            </h3>
            <p className="event-place">{point.name !== e.title ? point.name : e.place}</p>
            <p className="worldmap-popover-text">{e.headline}</p>
            <p className="event-countdown">{countdown(e, now, locale)}</p>
            {story ? <p className="worldmap-popover-lore">{story}</p> : null}
            {lore?.chapter ? (
                <a className="event-more-link" href={lore.chapter.href}>
                    {t('Read the lore', 'Leia a história')}: {lore.chapter.label}
                </a>
            ) : null}
        </>
    );
}

function RaidDetails({ raid, now }: { raid: RaidPin; now: number }) {
    const near = nearestLandmark(raid.x, raid.y);
    const returnsIn = raid.returnsAt ? Date.parse(raid.returnsAt) - now : 0;
    const locale = useLocale();
    const t = useT();

    return (
        <>
            <div className="event-top">
                <span className={`event-badge badge-${raid.alive ? 'ready' : 'slain'}`}>{raid.alive ? t('Roaming', 'À solta') : t('Slain', 'Derrotado')}</span>
                <span className="event-category">Raid Boss</span>
            </div>
            <h3 className="worldmap-popover-title">
                {raid.name}
                {raid.level ? <span className="event-level"> Lv {raid.level}</span> : null}
            </h3>
            {near ? <p className="event-place">{t('Near', 'Perto de')} {near.name}</p> : null}
            <p className="worldmap-popover-text">
                {raid.alive
                    ? t('Roams these lands right now. Gather your party and claim its treasure.', 'Vaga por estas terras agora mesmo. Reúna seu grupo e conquiste seu tesouro.')
                    : t(
                          'Slain by brave adventurers. When it returns, the race for its treasure begins again.',
                          'Derrotado por bravos aventureiros. Quando voltar, a corrida pelo seu tesouro começa de novo.',
                      )}
            </p>
            {!raid.alive && raid.returnsAt ? <p className="event-countdown">{returnsIn > 0 ? `${t('Returns in', 'Retorna em')} ${span(returnsIn)}` : t('Returning now', 'Retornando agora')}</p> : null}
            {near?.lore ? <p className="worldmap-popover-lore">{pick(locale, near.lore)}</p> : null}
        </>
    );
}

/**
 * The live world map: every boss, siege and contest plotted where it happens, with the story of the place.
 * Positions come from the server (EventFeed "at" and WorldMap), so they follow the game data and config.
 */
export function WorldMapSection({ feed, map }: { feed?: EventFeed | null; map?: WorldMapData | null }) {
    const now = useNow();
    const locale = useLocale();
    const t = useT();
    const { frameRef, view, smooth, wasDrag, zoomBy, reset, focus, handlers } = usePanZoom();
    const [layers, setLayers] = useState<Set<Layer>>(() => new Set(LAYERS.map((layer) => layer.key)));
    const [showSlain, setShowSlain] = useState(false);
    const [selection, setSelection] = useState<Selection | null>(null);

    // Raid bosses have their own layer from the map data, so their feed entries aren't plotted twice.
    const placed = useMemo(() => (feed?.events ?? []).filter((e) => e.category !== 'raid' && e.at?.length), [feed]);
    const raids = map?.raids ?? [];
    const visibleEvents = placed.filter((e) => layers.has(e.category));
    const visibleRaids = layers.has('raid') ? raids.filter((raid) => raid.alive || showSlain) : [];
    const aliveRaids = raids.filter((raid) => raid.alive);

    const selectedEvent = selection?.kind === 'event' ? placed.find((e) => e.id === selection.id) : undefined;
    const selectedPoint = selectedEvent?.at?.[selection?.kind === 'event' ? selection.point : 0];
    const selectedRaid = selection?.kind === 'raid' ? raids.find((raid) => raid.id === selection.id) : undefined;

    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setSelection(null);
        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const selectEvent = (event: GameEvent, point = 0, pan = false) => {
        setSelection({ kind: 'event', id: event.id, point });

        if (pan && event.at?.[point]) {
            focus(event.at[point]);
        }
    };

    const selectRaid = (raid: RaidPin, pan = false) => {
        setSelection({ kind: 'raid', id: raid.id });

        if (pan) {
            focus(raid);
        }
    };

    const toggleLayer = (key: Layer) =>
        setLayers((current) => {
            const next = new Set(current);

            if (!next.delete(key)) {
                next.add(key);
            }

            return next;
        });

    const counts: Record<Layer, number> = {
        epic: 0,
        siege: 0,
        olympiad: 0,
        event: 0,
        raid: aliveRaids.length,
    };
    placed.forEach((e) => (counts[e.category] += e.at!.length));

    const frameStyle = { '--s': view.s, '--x': view.x, '--y': view.y } as CSSProperties;

    return (
        <section className="world-map-section">
            <div className="container">
                <div className="worldmap">
                    <div
                        ref={frameRef}
                        className={`worldmap-frame${smooth ? ' is-smooth' : ''}${view.s > 1 ? ' is-zoomed' : ''}`}
                        style={frameStyle}
                        tabIndex={0}
                        role="application"
                        aria-label={t(
                            'World map of Aden. Arrow keys move the map, plus and minus zoom, 0 resets.',
                            'Mapa do mundo de Aden. As setas movem o mapa, mais e menos dão zoom, 0 volta ao início.',
                        )}
                        {...handlers}
                        onClick={(e) => {
                            if (!wasDrag() && !(e.target as HTMLElement).closest('button, .worldmap-popover')) {
                                setSelection(null);
                            }
                        }}
                    >
                        <div className="worldmap-layer">
                            <img src="/assets/map/aden-world-map.webp" alt="" width={1977} height={2620} loading="lazy" decoding="async" draggable={false} />
                        </div>
                        <div className="worldmap-vignette" aria-hidden="true"></div>

                        <div className="worldmap-pins">
                            {visibleRaids.map((raid) => (
                                <button
                                    key={`raid-${raid.id}`}
                                    type="button"
                                    tabIndex={-1}
                                    className={`map-raid${raid.alive ? ' is-alive' : ' is-slain'}${selectedRaid?.id === raid.id ? ' is-selected' : ''}`}
                                    style={pinStyle(raid)}
                                    data-name={`${raid.name}${raid.level ? ` · Lv ${raid.level}` : ''}`}
                                    aria-label={`${raid.name}, raid boss${raid.alive ? '' : `, ${t('slain', 'derrotado')}`}`}
                                    onClick={() => !wasDrag() && selectRaid(raid)}
                                ></button>
                            ))}
                            {visibleEvents.flatMap((e) =>
                                e.at!.map((point, i) => (
                                    <button
                                        key={`${e.id}-${i}`}
                                        type="button"
                                        className={`map-marker cat-${e.category} is-${e.state}${e.id === PUMPKIN_EVENT ? ' is-pumpkin' : ''}${selectedEvent?.id === e.id && selection?.kind === 'event' && selection.point === i ? ' is-selected' : ''}`}
                                        style={pinStyle(point)}
                                        aria-label={`${e.title}, ${point.name}: ${pick(locale, BADGE[e.state])}`}
                                        onClick={() => !wasDrag() && selectEvent(e, i)}
                                    >
                                        {e.id === PUMPKIN_EVENT ? (
                                            <Pumpkin />
                                        ) : (
                                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                                {ICONS[e.category as Exclude<Layer, 'raid'>]}
                                            </svg>
                                        )}
                                        {/* Live events are named on the map; ones spread over many sites only pulse. */}
                                        {e.state === 'live' && e.at!.length <= 2 ? (
                                            <span className="map-marker-label">{e.at!.length > 1 ? point.name : e.title}</span>
                                        ) : null}
                                    </button>
                                )),
                            )}
                        </div>

                        {selectedEvent && selectedPoint ? (
                            <Popover view={view} point={selectedPoint} onClose={() => setSelection(null)}>
                                <EventDetails event={selectedEvent} point={selectedPoint} now={now} />
                            </Popover>
                        ) : null}
                        {selectedRaid ? (
                            <Popover view={view} point={selectedRaid} onClose={() => setSelection(null)}>
                                <RaidDetails raid={selectedRaid} now={now} />
                            </Popover>
                        ) : null}

                        <div className="worldmap-controls">
                            <button type="button" onClick={() => zoomBy(1.6)} aria-label={t('Zoom in', 'Aproximar')} disabled={view.s >= MAX_ZOOM}>
                                +
                            </button>
                            <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label={t('Zoom out', 'Afastar')} disabled={view.s <= 1}>
                                −
                            </button>
                            <button type="button" onClick={reset} aria-label={t('Show the whole map', 'Mostrar o mapa inteiro')} disabled={view.s <= 1}>
                                ⤢
                            </button>
                        </div>
                    </div>

                    <aside className="worldmap-side">
                        <h3 className="worldmap-side-title">{t('Layers', 'Camadas')}</h3>
                        <div className="worldmap-layers">
                            {LAYERS.map((layer) => (
                                <button
                                    key={layer.key}
                                    type="button"
                                    className={`worldmap-layer-toggle cat-${layer.key}`}
                                    aria-pressed={layers.has(layer.key)}
                                    onClick={() => toggleLayer(layer.key)}
                                >
                                    <span className="worldmap-swatch" aria-hidden="true"></span>
                                    {pick(locale, layer.label)}
                                    <span className="worldmap-count">{counts[layer.key]}</span>
                                </button>
                            ))}
                        </div>
                        <label className="worldmap-check">
                            <input type="checkbox" checked={showSlain} onChange={(e) => setShowSlain(e.target.checked)} />
                            {t('Show slain raid bosses', 'Mostrar raid bosses derrotados')}
                        </label>

                        <label className="worldmap-find">
                            <span className="field-label">{t('Find a raid boss', 'Encontrar um raid boss')}</span>
                            <select
                                value=""
                                onChange={(e) => {
                                    const raid = raids.find((r) => r.id === Number(e.target.value));

                                    if (raid) {
                                        if (!raid.alive) {
                                            setShowSlain(true);
                                        }

                                        setLayers((current) => new Set(current).add('raid'));
                                        selectRaid(raid, true);
                                    }
                                }}
                            >
                                <option value="">{map ? `${aliveRaids.length} ${t('of', 'de')} ${raids.length} ${t('roaming…', 'à solta…')}` : t('Unavailable right now', 'Indisponível no momento')}</option>
                                {raids.map((raid) => (
                                    <option key={raid.id} value={raid.id}>
                                        {raid.name}
                                        {raid.level ? ` (Lv ${raid.level})` : ''}
                                        {raid.alive ? '' : ` · ${t('slain', 'derrotado')}`}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <h3 className="worldmap-side-title">{t('On the map', 'No mapa')}</h3>
                        <ul className="worldmap-list">
                            {placed.length ? null : <li className="about-empty">{t('Live events are unavailable right now.', 'Os eventos ao vivo estão indisponíveis no momento.')}</li>}
                            {placed.map((e) => (
                                <li key={e.id}>
                                    <button
                                        type="button"
                                        className={`worldmap-list-item is-${e.state}`}
                                        onClick={() => {
                                            setLayers((current) => new Set(current).add(e.category));
                                            selectEvent(e, 0, true);
                                        }}
                                    >
                                        <span className={`event-badge badge-${e.state}`}>{pick(locale, BADGE[e.state])}</span>
                                        <span className="worldmap-list-title">{e.title}</span>
                                        <span className="worldmap-list-meta">{countdown(e, now, locale)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="worldmap-note">
                            {t('Drag to move, pinch or Ctrl + scroll to zoom.', 'Arraste para mover, use o gesto de pinça ou Ctrl + rolagem para dar zoom.')}
                            {map?.beyond
                                ? ` ${t(
                                      `${map.beyond} more raid bosses roam lands beyond this map, in instance zones and hidden places.`,
                                      `Mais ${map.beyond} raid bosses vagam por terras fora deste mapa, em zonas instanciadas e lugares ocultos.`,
                                  )}`
                                : ''}
                        </p>
                    </aside>
                </div>
            </div>
        </section>
    );
}
