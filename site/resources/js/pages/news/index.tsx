import { Link } from '@inertiajs/react';
import { NEWS_CATEGORIES, NewsCard } from '@/components/news';
import PageHero from '@/components/page-hero';
import { pick, useLocale, useT } from '@/i18n';
import type { NewsCard as NewsCardData } from '@/types';

type Props = {
    category: string | null;
    posts: {
        data: NewsCardData[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
};

export default function NewsIndex({ category, posts }: Props) {
    const locale = useLocale();
    const t = useT();

    return (
        <>
            <PageHero
                kicker={t('The latest from the realm', 'O mais recente do reino')}
                title={t('News from Aden', 'Notícias de Aden')}
                tagline={t('Events, new quests, server updates and announcements.', 'Eventos, novas missões, atualizações do servidor e anúncios.')}
            />
            <section className="news-page">
                <div className="container">
                    <nav className="news-filters" aria-label={t('Categories', 'Categorias')}>
                        <Link href="/news" className={category === null ? 'is-active' : undefined} aria-current={category === null ? 'page' : undefined}>
                            {t('All', 'Todas')}
                        </Link>
                        {Object.entries(NEWS_CATEGORIES).map(([key, label]) => (
                            <Link key={key} href={`/news?category=${key}`} className={category === key ? 'is-active' : undefined} aria-current={category === key ? 'page' : undefined}>
                                {pick(locale, label)}
                            </Link>
                        ))}
                    </nav>
                    {posts.data.length ? (
                        <div className="news-grid">
                            {posts.data.map((post) => (
                                <NewsCard key={post.slug} post={post} />
                            ))}
                        </div>
                    ) : (
                        <p className="news-empty">{t('Nothing here yet. Check back soon.', 'Nada aqui ainda. Volte em breve.')}</p>
                    )}
                    {posts.last_page > 1 ? (
                        <nav className="items-pages" aria-label={t('Pages', 'Páginas')}>
                            {posts.prev_page_url ? (
                                <Link href={posts.prev_page_url} className="btn btn-outline btn-small">
                                    {t('Previous', 'Anterior')}
                                </Link>
                            ) : (
                                <span></span>
                            )}
                            <span>
                                {t('Page', 'Página')} {posts.current_page} {t('of', 'de')} {posts.last_page}
                            </span>
                            {posts.next_page_url ? (
                                <Link href={posts.next_page_url} className="btn btn-outline btn-small">
                                    {t('Next', 'Próxima')}
                                </Link>
                            ) : (
                                <span></span>
                            )}
                        </nav>
                    ) : null}
                </div>
            </section>
        </>
    );
}
