import { Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { languageTag, pick, useLocale, useT } from '@/i18n';
import type { PackageItem, PackageOffer } from '@/types';

const ARMOR = {
    heavy: { en: 'Heavy armor', pt: 'Armadura pesada' },
    light: { en: 'Light armor', pt: 'Armadura leve' },
    robe: { en: 'Robe', pt: 'Manto' },
};

/** One package's gear: weapon and armor with their enchant, then the jewelry; each links to the item database. */
export function PackageContents({ items, links = true }: { items: PackageItem[]; links?: boolean }) {
    return (
        <ul className="pkg-items">
            {items.map((item, i) => (
                <li key={`${item.id}-${i}`}>
                    {links && item.id ? (
                        <Link href={`/items/${item.id}`} className="pkg-item-link">
                            {item.enchant ? <span className="item-enchant">+{item.enchant}</span> : null} {item.name}
                        </Link>
                    ) : (
                        <>
                            {item.enchant ? <span className="item-enchant">+{item.enchant}</span> : null} {item.name}
                        </>
                    )}
                    {item.count && item.count > 1 ? <span className="gift-item-count"> × {item.count.toLocaleString()}</span> : null}
                </li>
            ))}
        </ul>
    );
}

/**
 * The catalog (/treasury): pick an archetype, see its gear in each tier with the price. action renders each tier box's
 * button (the store's Buy, or "bought this season").
 */
export function PackageCatalog({
    packages,
    archetype: initial,
    action,
}: {
    packages: PackageOffer;
    archetype?: string | null;
    action?: (tier: string, archetype: string) => ReactNode;
}) {
    const locale = useLocale();
    const t = useT();
    const [selected, setSelected] = useState(initial ?? packages.archetypes[0]?.key);
    const archetype = packages.archetypes.find((a) => a.key === selected) ?? packages.archetypes[0];
    const fmt = (n: number) => n.toLocaleString(languageTag(locale));

    if (!archetype) {
        return null;
    }

    return (
        <div className="pkg-catalog">
            <div className="pkg-archetypes" role="tablist" aria-label={t('Archetype', 'Arquétipo')}>
                {packages.archetypes.map((a) => (
                    <button
                        key={a.key}
                        type="button"
                        role="tab"
                        aria-selected={a.key === archetype.key}
                        className="pkg-archetype"
                        onClick={() => setSelected(a.key)}
                    >
                        <span className="pkg-archetype-name">{pick(locale, a.name)}</span>
                        <span className="pkg-archetype-role">{pick(locale, a.role)}</span>
                    </button>
                ))}
            </div>
            <p className="pkg-armor">
                {pick(locale, archetype.name)}: {pick(locale, archetype.role)} · {pick(locale, ARMOR[archetype.armor])}
            </p>
            <div className="pkg-tiers">
                {packages.tiers.map((tier) => (
                    <article key={tier.key} className={`pkg-tier is-${tier.key}`}>
                        <header className="pkg-tier-head">
                            <p className="pkg-tier-grade">
                                {t('Grade', 'Grau')} {tier.grade} · +{tier.enchant}
                            </p>
                            <h3 className="pkg-tier-name text-gold">{pick(locale, tier.name)}</h3>
                            <p className="pkg-tier-price">
                                {fmt(tier.price)} <span>{packages.currency}</span>
                            </p>
                        </header>
                        <PackageContents items={archetype.contents[tier.key] ?? []} />
                        {action ? <div className="pkg-tier-action">{action(tier.key, archetype.key)}</div> : null}
                    </article>
                ))}
            </div>
        </div>
    );
}
