import { usePoll } from '@inertiajs/react';
import PageHero from '@/components/page-hero';
import { WorldMapSection } from '@/components/world-map';
import { useT } from '@/i18n';
import type { EventFeed, WorldMapData } from '@/types';

type Props = {
    events?: EventFeed | null;
    map?: WorldMapData | null;
};

export default function MapPage({ events, map }: Props) {
    usePoll(30_000, { only: ['events', 'map'] });
    const t = useT();

    return (
        <>
            <PageHero
                className="map-hero"
                kicker={t('Live from the realm', 'Ao vivo do reino')}
                title={t('Map of Aden', 'Mapa de Aden')}
                tagline={t(
                    'Every boss, siege, contest and event on the server, plotted where it happens and updated live. Tap a marker for its story.',
                    'Todos os chefes, cercos, disputas e eventos do servidor, marcados onde acontecem e atualizados ao vivo. Toque em um marcador para ver sua história.',
                )}
            />

            <WorldMapSection feed={events} map={map} />
        </>
    );
}
