<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Search and share metadata for a page: title, description, canonical URL, share image, robots and JSON-LD.
 * Controllers pass it as the "seo" prop; resources/views/app.blade.php writes it into the HTML <head> on the server
 * (so crawlers and link previews that don't run JavaScript see it) and the layout keeps the browser title in sync.
 */
final class Seo
{
    /** Search engines show about this many characters of a description. */
    private const DESCRIPTION_LENGTH = 160;

    /**
     * @param  string|null  $title  page title, null for the home page
     * @param  list<array<string, mixed>>  $jsonLd  structured data blocks (schema.org)
     * @return array{title: string, description: string, canonical: string, image: string, robots: string, jsonLd: list<array<string, mixed>>}
     */
    public static function make(?string $title, string $description, bool $index = true, array $jsonLd = [], ?string $canonical = null, ?string $image = null): array
    {
        $brand = self::brand();

        return [
            'title' => $title === null ? __(':brand — Free Lineage II Essence Server', ['brand' => $brand]) : "{$title} | {$brand}",
            'description' => Str::limit(preg_replace('/\s+/', ' ', trim($description)), self::DESCRIPTION_LENGTH, '…', preserveWords: true),
            'canonical' => $canonical ?? url()->current(),
            'image' => $image ?? url('/assets/og-image.jpg'),
            'robots' => $index ? 'index, follow' : 'noindex, follow',
            'jsonLd' => $jsonLd,
        ];
    }

    /**
     * For pages only signed-in players or one-time links use (player area, account forms).
     *
     * @return array{title: string, description: string, canonical: string, image: string, robots: string, jsonLd: list<array<string, mixed>>}
     */
    public static function private(string $title): array
    {
        return self::make($title, __('Your :brand game account.', ['brand' => self::brand()]), index: false);
    }

    /**
     * "L2 Kage".
     */
    public static function brand(): string
    {
        return 'L2 '.config('l2j.server_name');
    }

    /**
     * Breadcrumbs for structured data: [name => url, ...] from the home page down.
     *
     * @param  array<string, string>  $trail
     * @return array<string, mixed>
     */
    public static function breadcrumbs(array $trail): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn (string $name, string $url, int $i): array => [
                '@type' => 'ListItem', 'position' => $i + 1, 'name' => $name, 'item' => $url,
            ], array_keys($trail), $trail, array_keys(array_keys($trail))),
        ];
    }
}
