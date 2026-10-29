<?php

/*
 * Crawlers the site keeps out (robots.txt and App\Http\Middleware\BlockCrawlers): AI training and answer bots, and
 * SEO scrapers. Search engines (Googlebot, Bingbot...) and link previews (Discord, WhatsApp, Facebook, X) stay
 * allowed, so players still find the server and shared links still show a card.
 *
 * "robots" are robots.txt tokens; most are also in the bot's User-Agent, so the middleware refuses those requests
 * with 403 (robots.txt is only a request; many AI bots ignore it). A few tokens are robots.txt-only opt-outs used by
 * crawlers that also serve search (Google-Extended, Applebot-Extended): they never appear in a User-Agent.
 */
return [
    'enabled' => (bool) env('BLOCK_AI_CRAWLERS', true),

    'robots' => [
        // AI training and answer bots
        'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Claude-Web', 'anthropic-ai',
        'CCBot', 'Google-Extended', 'GoogleOther', 'Applebot-Extended', 'Bytespider', 'PerplexityBot', 'Perplexity-User',
        'Amazonbot', 'meta-externalagent', 'meta-externalfetcher', 'FacebookBot', 'cohere-ai', 'cohere-training-data-crawler',
        'Diffbot', 'ImagesiftBot', 'Omgilibot', 'Omgili', 'Timpibot', 'YouBot', 'AI2Bot', 'Ai2Bot-Dolma', 'DuckAssistBot',
        'MistralAI-User', 'PanguBot', 'Kangaroo Bot', 'Webzio-Extended', 'img2dataset', 'Scrapy', 'iaskspider', 'TikTokSpider',
        // SEO scrapers
        'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'DataForSeoBot', 'BLEXBot', 'PetalBot', 'SeekportBot', 'serpstatbot',
    ],

    // robots.txt-only tokens: never in a User-Agent, so the middleware doesn't look for them.
    'robots_only' => ['Google-Extended', 'Applebot-Extended', 'Webzio-Extended'],
];
