import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { GradeBadge, ItemIcon, kindLabel } from '@/components/item-icon';
import PageHero from '@/components/page-hero';
import { languageTag, pick, useLocale, useT, type Localized } from '@/i18n';
import type { ItemSummary } from '@/types';

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    filters: { q: string; category: string | null; grade: string | null };
    loaded: boolean;
    results: Paginated<ItemSummary>;
};

const CATEGORIES: { key: string; label: Localized }[] = [
    { key: '', label: { en: 'All', pt: 'Todos' } },
    { key: 'weapon', label: { en: 'Weapons', pt: 'Armas' } },
    { key: 'armor', label: { en: 'Armor', pt: 'Armaduras' } },
    { key: 'jewelry', label: { en: 'Jewelry', pt: 'Joias' } },
    { key: 'accessory', label: { en: 'Accessories', pt: 'Acessórios' } },
    { key: 'etc', label: { en: 'Other', pt: 'Outros' } },
];

const GRADES: { key: string; label: Localized }[] = [
    { key: '', label: { en: 'Any grade', pt: 'Qualquer grau' } },
    { key: 'none', label: { en: 'No grade', pt: 'Sem grau' } },
    ...['D', 'C', 'B', 'A', 'S', 'R', 'R99'].map((g) => ({ key: g, label: { en: `${g}-grade`, pt: `Grau ${g}` } })),
];

export default function ItemsIndex({ filters, loaded, results }: Props) {
    const [q, setQ] = useState(filters.q);
    const locale = useLocale();
    const t = useT();
    const category = CATEGORIES.find((c) => c.key && c.key === filters.category);
    const grade = GRADES.find((g) => g.key && g.key === filters.grade);
    // Named in the result count, so a forgotten filter doesn't look like a missing item.
    const activeFilters = [category && pick(locale, category.label), grade && pick(locale, grade.label)].filter(Boolean) as string[];
    const first = useRef(true);

    const search = (changes: Partial<Props['filters']>) => {
        const params = Object.fromEntries(Object.entries({ ...filters, q, ...changes }).filter(([, value]) => value));
        router.get('/items', params, { preserveState: true, preserveScroll: true, replace: true, only: ['filters', 'results'] });
    };

    // Search as you type (after a short pause).
    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const timer = window.setTimeout(() => search({ q }), 300);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <>
            <PageHero
                className="items-hero"
                kicker={t('Item Database', 'Banco de Itens')}
                title={t('Items of Aden', 'Itens de Aden')}
                tagline={t(
                    'Every weapon, armor and treasure on the server: stats, who drops it at our rates, where to buy it and how to craft it.',
                    'Todas as armas, armaduras e tesouros do servidor: atributos, quem dropa nas nossas rates, onde comprar e como fabricar.',
                )}
            />

            <section className="items-section">
                <div className="container">
                    <form className="items-filters" role="search" onSubmit={(e) => (e.preventDefault(), search({ q }))}>
                        <label className="items-query">
                            <span className="sr-only">{t('Search items', 'Buscar itens')}</span>
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={t('Search by name or ID, e.g. dagger', 'Busque por nome ou ID, ex.: dagger')}
                                autoFocus
                            />
                        </label>
                        <div className="items-chips" role="group" aria-label={t('Category', 'Categoria')}>
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    className="items-chip"
                                    aria-pressed={(filters.category ?? '') === c.key}
                                    onClick={() => search({ category: c.key || null })}
                                >
                                    {pick(locale, c.label)}
                                </button>
                            ))}
                        </div>
                        <select aria-label={t('Grade', 'Grau')} value={filters.grade ?? ''} onChange={(e) => search({ grade: e.target.value || null })}>
                            {GRADES.map((g) => (
                                <option key={g.key} value={g.key}>
                                    {pick(locale, g.label)}
                                </option>
                            ))}
                        </select>
                    </form>

                    {!loaded ? (
                        <p className="about-empty">{t('The item database is being loaded. Try again in a minute.', 'O banco de itens está sendo carregado. Tente de novo em um minuto.')}</p>
                    ) : (
                        <>
                            <p className="items-count" aria-live="polite">
                                {results.total
                                    ? `${results.total.toLocaleString(languageTag(locale))} ${results.total === 1 ? 'item' : t('items', 'itens')}`
                                    : t('No items match your search', 'Nenhum item corresponde à busca')}
                                {activeFilters.length ? ` ${t('in', 'em')} ${activeFilters.join(', ')}` : ''}
                                {results.total ? '' : '.'}
                                {activeFilters.length ? (
                                    <button type="button" className="items-clear" onClick={() => search({ category: null, grade: null })}>
                                        {results.total ? t('Clear filters', 'Limpar filtros') : t('Search all items', 'Buscar em todos os itens')}
                                    </button>
                                ) : null}
                            </p>
                            <ul className="items-list">
                                {results.data.map((item) => (
                                    <li key={item.id}>
                                        <Link href={`/items/${item.id}`} className="items-row">
                                            <ItemIcon item={item} />
                                            <span className="items-row-name">{item.name}</span>
                                            <span className="items-row-meta">
                                                <GradeBadge grade={item.grade} />
                                                <span>{kindLabel(item.kind, locale)}</span>
                                                <span className="items-row-id">#{item.id}</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {results.last_page > 1 ? (
                                <nav className="items-pages" aria-label={t('Pages', 'Páginas')}>
                                    {results.prev_page_url ? (
                                        <Link href={results.prev_page_url} preserveState className="btn btn-outline btn-small">
                                            {t('Previous', 'Anterior')}
                                        </Link>
                                    ) : (
                                        <span></span>
                                    )}
                                    <span>
                                        {t('Page', 'Página')} {results.current_page} {t('of', 'de')} {results.last_page}
                                    </span>
                                    {results.next_page_url ? (
                                        <Link href={results.next_page_url} preserveState className="btn btn-outline btn-small">
                                            {t('Next', 'Próxima')}
                                        </Link>
                                    ) : (
                                        <span></span>
                                    )}
                                </nav>
                            ) : null}
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
