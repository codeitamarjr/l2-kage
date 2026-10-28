import { useState } from 'react';
import { Divider } from '@/components/decor';
import { pick, raceName, useLocale, useT, type Localized } from '@/i18n';

// width/height: the portrait's crop size; races without portrait art yet (Sylph, High Elf) show a crest instead.
type Race = { key: string; name: string; kicker: Localized; desc: Localized; width?: number; height?: number };

// Portraits cut from web/source/races-guide.avif (see crop-races.sh); widths/heights are the crop sizes.
// Classes are those of Lineage II Essence (Samurai Crow).
const RACES: Race[] = [
    { key: 'human', name: 'Human', kicker: { en: 'Knights of Aden', pt: 'Cavaleiros de Aden' }, width: 246, height: 369,
        desc: { en: 'Versatile warriors and mages, sworn to the crown. Paladins, Duelists, Archmages and Death Knights rise from their ranks, and the Wargs hunt as wolves.', pt: 'Guerreiros e magos versáteis, jurados à coroa. Paladinos, Duelistas, Arquimagos e Death Knights surgem de suas fileiras, e os Wargs caçam como lobos.' } },
    { key: 'elf', name: 'Elf', kicker: { en: 'Children of Eva', pt: 'Filhos de Eva' }, width: 222, height: 333,
        desc: { en: 'Agile and graceful, gifted in magic and precision. Templars, Sword Muses and Moonlight Sentinels guard the forests of Aden.', pt: 'Ágeis e graciosos, dotados de magia e precisão. Templários, Sword Muses e Moonlight Sentinels guardam as florestas de Aden.' } },
    { key: 'darkelf', name: 'Dark Elf', kicker: { en: 'Children of Shilen', pt: 'Filhos de Shilen' }, width: 242, height: 363,
        desc: { en: 'Masters of forbidden magic and deadly blades. Spellhowlers, Assassins and the Blood Rose strike from the shadows.', pt: 'Mestres da magia proibida e de lâminas mortais. Spellhowlers, Assassinos e a Blood Rose atacam das sombras.' } },
    { key: 'orc', name: 'Orc', kicker: { en: 'Sons of Pa\'agrio', pt: 'Filhos de Pa\'agrio' }, width: 248, height: 372,
        desc: { en: 'Unbreakable fury and fire. Titans, Grand Khavatari and the mounted Vanguard Riders shake the battlefield.', pt: 'Fúria e fogo inquebráveis. Titãs, Grand Khavatari e os Vanguard Riders montados fazem o campo de batalha tremer.' } },
    { key: 'dwarf', name: 'Dwarf', kicker: { en: 'Children of Maphr', pt: 'Filhos de Maphr' }, width: 242, height: 363,
        desc: { en: 'Sturdy defenders and master artisans. Fortune Seekers and Maestros dig, craft and fight for every adena.', pt: 'Defensores robustos e mestres artesãos. Fortune Seekers e Maestros escavam, fabricam e lutam por cada adena.' } },
    { key: 'kamael', name: 'Kamael', kicker: { en: 'The Winged Ones', pt: 'Os Alados' }, width: 262, height: 393,
        desc: { en: 'Winged warriors forged for war. Doombringers and Soul Hounds wield ancient soul magic, and the Samurai fights with the katana.', pt: 'Guerreiros alados forjados para a guerra. Doombringers e Soul Hounds dominam a antiga magia das almas, e o Samurai luta com a katana.' } },
    { key: 'sylph', name: 'Sylph', kicker: { en: 'Riders of the Wind', pt: 'Cavaleiros do Vento' },
        desc: { en: 'Swift and sure-eyed, they fight with firearms and the power of the elemental spirits. Sharpshooters and Storm Blasters.', pt: 'Velozes e de mira certeira, lutam com armas de fogo e o poder dos espíritos elementais. Sharpshooters e Storm Blasters.' } },
    { key: 'highelf', name: 'High Elf', kicker: { en: 'Heirs of the Elements', pt: 'Herdeiros dos Elementos' },
        desc: { en: 'Elves of an older line, bound to the elements and the divine. Element Weavers and Divine Templars.', pt: 'Elfos de uma linhagem mais antiga, ligados aos elementos e ao divino. Element Weavers e Divine Templars.' } },
];

export default function RacesSection() {
    const [active, setActive] = useState(RACES[0]);
    const locale = useLocale();
    const t = useT();

    return (
        <section id="races" className="races">
            <div className="container">
                <div className="section-head">
                    <p className="reveal kicker">{t('Choose Your Blood', 'Escolha Seu Sangue')}</p>
                    <h2 className="reveal section-title text-gold">{t('The Races', 'As Raças')}</h2>
                    <Divider />
                </div>
                <div className="races-grid">
                    <div className="reveal race-portrait">
                        {RACES.map((race) =>
                            race.width ? (
                                <img
                                    key={race.key}
                                    src={`/assets/race-${race.key}.jpg`}
                                    alt={race.name}
                                    width={race.width}
                                    height={race.height}
                                    loading="lazy"
                                    className={race.key === active.key ? 'is-active' : undefined}
                                />
                            ) : (
                                <div key={race.key} className={`race-crest${race.key === active.key ? ' is-active' : ''}`} aria-label={race.name}>
                                    <span className="text-gold">{raceName(locale, race.name)}</span>
                                </div>
                            ),
                        )}
                        <div className="race-fade bg-fade"></div>
                    </div>
                    <div className="reveal">
                        <div className="race-tabs" role="tablist">
                            {RACES.map((race) => (
                                <button
                                    key={race.key}
                                    type="button"
                                    className={`race-tab${race.key === active.key ? ' is-active' : ''}`}
                                    role="tab"
                                    aria-selected={race.key === active.key}
                                    onClick={() => setActive(race)}
                                >
                                    {raceName(locale, race.name)}
                                </button>
                            ))}
                        </div>
                        <p className="race-kicker">{pick(locale, active.kicker)}</p>
                        <h3 className="race-name text-gold">{raceName(locale, active.name)}</h3>
                        <p className="race-desc">{pick(locale, active.desc)}</p>
                        <p className="race-note">{t('Each race has unique bonuses and excels in different classes.', 'Cada raça tem bônus únicos e se destaca em classes diferentes.')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
