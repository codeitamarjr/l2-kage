import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { GradeBadge, ItemIcon, kindLabel } from '@/components/item-icon';
import { languageTag, useLocale, useT, type Locale } from '@/i18n';
import type { ItemDetail, ItemRecipe, ItemRef, ItemSource, ItemSummary } from '@/types';

type Props = {
    item: ItemDetail;
    rates: { drop: number; spoil: number; raid: number; adenaAmount: number };
};

// The page's language for fmt; set by ItemShow (the page component) on every render, before its children.
let locale: Locale = 'en';
const fmt = (n: number) => n.toLocaleString(languageTag(locale));

const STAT_LABELS_PT: Record<string, string> = {
    pAtk: 'Atq. F.', mAtk: 'Atq. M.', pAtkSpd: 'Vel. Atq.', critRate: 'Crítico', accCombat: 'Precisão', pAtkRange: 'Alcance do ataque',
    pDef: 'Def. F.', mDef: 'Def. M.', maxMp: 'MP máx.', sDef: 'Defesa do escudo', rShld: 'Taxa de bloqueio do escudo', rEvas: 'Evasão',
    fireRes: 'Resistência ao fogo', waterRes: 'Resistência à água', windRes: 'Resistência ao vento', earthRes: 'Resistência à terra',
    holyRes: 'Resistência sagrada', darkRes: 'Resistência sombria', holyPower: 'Ataque sagrado', magicSuccRes: 'Resistência mágica',
};

const STAT_LABELS: Record<string, string> = {
    pAtk: 'P. Atk.', mAtk: 'M. Atk.', pAtkSpd: 'Atk. Spd.', critRate: 'Critical', accCombat: 'Accuracy', pAtkRange: 'Attack range',
    pDef: 'P. Def.', mDef: 'M. Def.', maxMp: 'Max MP', sDef: 'Shield defense', rShld: 'Shield block rate', rEvas: 'Evasion',
    fireRes: 'Fire resistance', waterRes: 'Water resistance', windRes: 'Wind resistance', earthRes: 'Earth resistance',
    holyRes: 'Holy resistance', darkRes: 'Dark resistance', holyPower: 'Holy attack', magicSuccRes: 'Magic resistance',
};

const statValue = ({ op, val }: { op: string; val: number }) => {
    const n = Number.isInteger(val) ? val : Math.round(val * 100) / 100;

    return op === 'add' ? `${n > 0 ? '+' : ''}${n}` : op === 'mul' ? `×${n}` : String(n);
};

const chance = (value: number) => (value >= 1 ? `${value.toFixed(2)}%` : value >= 0.01 ? `${value.toFixed(3)}%` : `${value.toPrecision(2)}%`);

function ItemLink({ refItem }: { refItem: ItemRef }) {
    const item = refItem.item;

    return (
        <Link href={`/items/${item.id}`} className="item-link">
            {'kind' in item ? <ItemIcon item={item as ItemSummary} size="sm" /> : null}
            <span>
                {refItem.count > 1 ? `${fmt(refItem.count)} × ` : ''}
                {item.name}
            </span>
        </Link>
    );
}

function Sources({ title, note, sources }: { title: string; note: string; sources: { rows: ItemSource[]; total: number } }) {
    const [all, setAll] = useState(false);
    const t = useT();

    if (!sources.total) {
        return null;
    }

    const rows = all ? sources.rows : sources.rows.slice(0, 15);

    return (
        <section className="item-block">
            <h2 className="item-block-title">
                {title} <span className="item-block-count">{fmt(sources.total)}</span>
            </h2>
            <p className="item-block-note">{note}</p>
            <div className="items-table-wrap">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>{t('Monster', 'Monstro')}</th>
                            <th className="num">{t('Level', 'Nível')}</th>
                            <th className="num">{t('Amount', 'Quantidade')}</th>
                            <th className="num">{t('Chance', 'Chance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={`${row.npc.id}-${i}`}>
                                <td>
                                    {row.npc.name}
                                    {['RaidBoss', 'GrandBoss'].includes(row.npc.type) ? <span className="item-tag">{row.npc.type === 'GrandBoss' ? t('Epic', 'Épico') : 'Raid'}</span> : null}
                                </td>
                                <td className="num">{row.npc.level}</td>
                                <td className="num">{row.min === row.max ? fmt(row.min) : `${fmt(row.min)}–${fmt(row.max)}`}</td>
                                <td className="num item-chance">{chance(row.chance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sources.rows.length > 15 ? (
                <button type="button" className="btn btn-outline btn-small item-more" onClick={() => setAll((v) => !v)}>
                    {all ? t('Show fewer', 'Mostrar menos') : `${t('Show all', 'Mostrar todos os')} ${fmt(sources.rows.length)}`}
                </button>
            ) : null}
            {sources.total > sources.rows.length ? <p className="item-block-note">{t(`Showing the ${fmt(sources.rows.length)} best chances.`, `Mostrando as ${fmt(sources.rows.length)} melhores chances.`)}</p> : null}
        </section>
    );
}

function Recipes({ title, recipes }: { title: string; recipes: ItemRecipe[] }) {
    const t = useT();

    if (!recipes.length) {
        return null;
    }

    return (
        <section className="item-block">
            <h2 className="item-block-title">
                {title} <span className="item-block-count">{recipes.length}</span>
            </h2>
            <div className="recipe-list">
                {recipes.map((r) => (
                    <article key={r.id} className="recipe">
                        <header className="recipe-head">
                            <Link href={`/items/${r.recipe.id}`} className="recipe-name">
                                {r.recipe.name}
                            </Link>
                            <span className="recipe-meta">
                                {r.dwarven ? t('Dwarven craft', 'Fabricação anã') : t('Common craft', 'Fabricação comum')} Lv {r.level} · {r.successRate}%{' '}
                                {t('success', 'de sucesso')} · {fmt(r.mpCost)} MP
                            </span>
                        </header>
                        <p className="recipe-row">
                            <span className="recipe-label">{t('Makes', 'Produz')}</span> <ItemLink refItem={r.product} />
                            {r.rare ? (
                                <>
                                    {' '}
                                    <span className="recipe-label">{t(`or, ${r.rare.chance}% of the time,`, `ou, em ${r.rare.chance}% das vezes,`)}</span> <ItemLink refItem={r.rare} />
                                </>
                            ) : null}
                        </p>
                        <ul className="recipe-ingredients">
                            {r.ingredients.map((ing) => (
                                <li key={ing.item.id}>
                                    <ItemLink refItem={ing} />
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default function ItemShow({ item, rates }: Props) {
    locale = useLocale();
    const t = useT();
    const statLabels = locale === 'pt_BR' ? STAT_LABELS_PT : STAT_LABELS;
    const stats = Object.entries(item.stats).filter(([key]) => STAT_LABELS[key]);
    const properties: [string, string][] = [
        [t('Type', 'Tipo'), `${kindLabel(item.kind, locale)}${item.flags.magic ? t(' (magic)', ' (mágica)') : ''}`],
        [t('Weight', 'Peso'), fmt(item.weight)],
        [t('Price', 'Preço'), `${fmt(item.price)} Adena`],
        ...(item.flags.sellable && item.price ? [[t('Sells to shops for', 'Vende para lojas por'), `${fmt(Math.floor(item.price / 2))} Adena`] as [string, string]] : []),
        ...(item.crystals ? [[t('Crystals', 'Cristais'), `${fmt(item.crystals)} × ${t(`${item.grade}-grade`, `grau ${item.grade}`)}`] as [string, string]] : []),
        ...(item.soulshots ? [['Soulshots / Spiritshots', `${item.soulshots} / ${item.spiritshots ?? 0}`] as [string, string]] : []),
        ...(item.mpConsume ? [[t('MP per attack', 'MP por ataque'), String(item.mpConsume)] as [string, string]] : []),
        ...(item.flags.limited ? [[t('Time limit', 'Tempo limite'), `${fmt(item.flags.limited)} min`] as [string, string]] : []),
    ];
    const restrictions = [
        item.flags.stackable && t('Stackable', 'Empilhável'),
        !item.flags.tradable && t('Cannot be traded', 'Não pode ser trocado'),
        !item.flags.droppable && t('Cannot be dropped', 'Não pode ser largado'),
        !item.flags.sellable && t('Cannot be sold', 'Não pode ser vendido'),
        item.flags.quest && t('Quest item', 'Item de missão'),
    ].filter(Boolean) as string[];
    const nothing = !item.drops.total && !item.spoils.total && !item.merchants.length && !item.craftedBy.length;

    return (
        <>
            <section className="item-page">
                <div className="container">
                    <nav className="item-crumbs" aria-label={t('Breadcrumb', 'Navegação')}>
                        <Link href="/items">{t('Item Database', 'Banco de Itens')}</Link> <span aria-hidden="true">/</span> {item.name}
                    </nav>

                    <header className="item-head">
                        <ItemIcon item={item} size="lg" />
                        <div>
                            <p className="hero-kicker item-kicker">
                                {kindLabel(item.kind, locale)} · #{item.id}
                            </p>
                            <h1 className="item-title text-gold">{item.name}</h1>
                            <p className="item-subline">
                                <GradeBadge grade={item.grade} />
                                {restrictions.map((r) => (
                                    <span key={r} className="item-tag">
                                        {r}
                                    </span>
                                ))}
                            </p>
                        </div>
                    </header>

                    <div className="item-grid">
                        {stats.length ? (
                            <section className="item-block">
                                <h2 className="item-block-title">{t('Stats', 'Atributos')}</h2>
                                <dl className="item-stats">
                                    {stats.map(([key, stat]) => (
                                        <div key={key}>
                                            <dt>{statLabels[key] ?? STAT_LABELS[key]}</dt>
                                            <dd>{statValue(stat)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        ) : null}
                        <section className="item-block">
                            <h2 className="item-block-title">{t('Properties', 'Propriedades')}</h2>
                            <dl className="item-stats">
                                {properties.map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    </div>

                    <Sources
                        title={t('Dropped by', 'Dropado por')}
                        sources={item.drops}
                        note={t(
                            `Chances at this server's rates (drop x${rates.drop}, raid bosses x${rates.raid}, Adena amount x${rates.adenaAmount}), for a character near the monster's level.`,
                            `Chances nas rates deste servidor (drop x${rates.drop}, raid bosses x${rates.raid}, quantidade de Adena x${rates.adenaAmount}), para um personagem perto do nível do monstro.`,
                        )}
                    />
                    <Sources
                        title={t('Spoiled from', 'Spoil de')}
                        sources={item.spoils}
                        note={t(
                            `Use Spoil on these monsters, then Sweeper. Chances at this server's spoil rate (x${rates.spoil}).`,
                            `Use Spoil nesses monstros e depois Sweeper. Chances na rate de spoil deste servidor (x${rates.spoil}).`,
                        )}
                    />

                    {item.merchants.length ? (
                        <section className="item-block">
                            <h2 className="item-block-title">
                                {t('Sold by', 'Vendido por')} <span className="item-block-count">{item.merchants.length}</span>
                            </h2>
                            <p className="item-block-note">
                                {t(`Price ${fmt(item.price)} Adena, plus the castle tax of the town.`, `Preço ${fmt(item.price)} Adena, mais a taxa do castelo da cidade.`)}
                            </p>
                            <ul className="item-merchants">
                                {item.merchants.map((m) => (
                                    <li key={m.id}>
                                        {m.title ? <span className="item-merchant-title">{m.title}</span> : null} {m.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <Recipes title={t('Crafted with', 'Fabricado com')} recipes={item.craftedBy} />
                    <Recipes title={t('This recipe teaches', 'Esta receita ensina')} recipes={item.teaches} />
                    <Recipes title={t('Used to craft', 'Usado para fabricar')} recipes={item.usedIn} />

                    {nothing ? (
                        <p className="about-empty item-nothing">
                            {t(
                                'No monster drops this item and no merchant sells it. It comes from quests, events or other sources.',
                                'Nenhum monstro dropa este item e nenhum mercador o vende. Ele vem de missões, eventos ou outras fontes.',
                            )}
                        </p>
                    ) : null}
                </div>
            </section>
        </>
    );
}
