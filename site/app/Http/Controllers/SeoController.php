<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * robots.txt and sitemap.xml for search engines, built from the site's own address (APP_URL).
 */
class SeoController extends Controller
{
    public function robots(): Response
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            // Private or one-time pages: nothing to index there.
            'Disallow: /admin',
            'Disallow: /account',
            'Disallow: /register/confirm/',
            'Disallow: /reset-password/',
            '',
            'Sitemap: '.url('/sitemap.xml'),
        ];

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /**
     * The public pages and every item page (25,129: well under the 50,000 a sitemap may hold). Cached for a day.
     */
    public function sitemap(): Response
    {
        $xml = Cache::remember('seo.sitemap', now()->addDay(), function (): string {
            $itemsUpdated = DB::table('itemdb_meta')->where('key', 'imported_at')->value('value');
            $itemsDate = $itemsUpdated ? substr($itemsUpdated, 0, 10) : null;
            $urls = [
                ['/', 'daily', '1.0', null], ['/about', 'hourly', '0.8', null], ['/map', 'hourly', '0.8', null],
                ['/lore', 'monthly', '0.7', null], ['/items', 'weekly', '0.8', $itemsDate], ['/register', 'monthly', '0.6', null],
            ];

            foreach (DB::table('itemdb_items')->orderBy('id')->pluck('id') as $id) {
                $urls[] = ["/items/{$id}", 'monthly', '0.5', $itemsDate];
            }

            $body = '';

            foreach ($urls as [$path, $frequency, $priority, $date]) {
                $body .= '<url><loc>'.e(url($path)).'</loc>'.($date ? "<lastmod>{$date}</lastmod>" : '')
                    ."<changefreq>{$frequency}</changefreq><priority>{$priority}</priority></url>\n";
            }

            return '<?xml version="1.0" encoding="UTF-8"?>'."\n"
                .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n".$body.'</urlset>'."\n";
        });

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
