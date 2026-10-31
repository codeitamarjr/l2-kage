import { Link } from '@inertiajs/react';
import { NEWS_CATEGORIES, newsDate } from '@/components/news';
import { pick, useLocale, useT } from '@/i18n';
import type { NewsCard } from '@/types';

export default function NewsShow({ post }: { post: NewsCard & { body: string } }) {
    const locale = useLocale();
    const t = useT();
    const category = NEWS_CATEGORIES[post.category];

    return (
        <article className="news-article">
            <div className="news-article-inner">
                <Link href="/news" className="news-back">
                    {t('All news', 'Todas as notícias')}
                </Link>
                <p className="news-card-meta">
                    <span className="news-category">{category ? pick(locale, category) : post.category}</span>
                    {post.publishedAt ? <time dateTime={post.publishedAt}>{newsDate(post.publishedAt, locale)}</time> : null}
                </p>
                <h1 className="news-article-title text-gold">{post.title}</h1>
                <p className="news-article-summary">{post.summary}</p>
                {post.image ? <img className="news-article-image" src={post.image} alt="" /> : null}
                {/* Markdown written in the admin panel, with raw HTML removed on the server (NewsPost::bodyHtml). */}
                <div className="news-body" dangerouslySetInnerHTML={{ __html: post.body }} />
            </div>
        </article>
    );
}
