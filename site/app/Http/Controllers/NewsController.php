<?php

namespace App\Http\Controllers;

use App\Models\NewsPost;
use App\Services\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(Request $request): Response
    {
        $category = array_key_exists((string) $request->query('category'), NewsPost::CATEGORIES) ? (string) $request->query('category') : null;

        return Inertia::render('news/index', [
            'category' => $category,
            'posts' => NewsPost::published()
                ->when($category, fn ($query) => $query->where('category', $category))
                ->paginate(9)
                ->withQueryString()
                ->through(fn (NewsPost $post): array => $post->card()),
            'seo' => Seo::make(
                __('News from Aden'),
                __('News from :brand: events, new quests, server updates and announcements.', ['brand' => Seo::brand()]),
                index: $category === null,
                canonical: url('/news'),
            ),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = NewsPost::published()->where('slug', $slug)->firstOrFail();
        $card = $post->card();

        return Inertia::render('news/show', [
            'post' => [...$card, 'body' => $post->bodyHtml()],
            'seo' => Seo::make(
                $card['title'],
                $card['summary'],
                jsonLd: [[
                    '@context' => 'https://schema.org',
                    '@type' => 'NewsArticle',
                    'headline' => $card['title'],
                    'description' => $card['summary'],
                    'datePublished' => $card['publishedAt'],
                    'dateModified' => $post->updated_at?->toIso8601String(),
                    'url' => url()->current(),
                ]],
                image: $card['image'],
            ),
        ]);
    }
}
