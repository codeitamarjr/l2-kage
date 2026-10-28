<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_send_their_own_metadata_in_the_html(): void
    {
        $home = $this->get('/')->assertOk();
        $home->assertSee('<title>L2 Kage — Free Lineage II Essence Server</title>', false)
            ->assertSee('<meta name="description" content="L2 Kage: a free Lineage II Essence server on the Samurai Crow update.', false)
            ->assertSee('<meta property="og:image" content="'.url('/assets/og-image.jpg').'">', false)
            ->assertSee('<link rel="canonical" href="'.url('/').'">', false)
            ->assertSee('"@type":"WebSite"', false);

        $this->get('/lore')->assertSee('<title>Lore of Aden: Lineage II History to Essence Samurai Crow | L2 Kage</title>', false)
            ->assertSee('<meta name="robots" content="index, follow">', false);
    }

    public function test_private_pages_and_searches_are_not_indexed(): void
    {
        foreach (['/account', '/forgot-password', '/items?q=sword'] as $url) {
            $this->get($url)->assertOk()->assertSee('<meta name="robots" content="noindex, follow">', false);
        }

        $this->get('/items')->assertSee('<meta name="robots" content="index, follow">', false);
    }

    public function test_robots_txt_points_to_the_sitemap(): void
    {
        $this->get('/robots.txt')->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /admin')
            ->assertSee('Sitemap: '.url('/sitemap.xml'));
    }

    public function test_the_sitemap_lists_pages_and_items(): void
    {
        $this->artisan('itemdb:import')->assertSuccessful();

        $response = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $xml = simplexml_load_string($response->getContent());

        $this->assertNotFalse($xml);
        $this->assertGreaterThan(25000, count($xml->url));
        $this->assertStringContainsString('<loc>'.url('/items/223').'</loc>', $response->getContent());
        $this->assertStringNotContainsString('/account', $response->getContent());
    }

    public function test_item_pages_describe_the_item(): void
    {
        $this->artisan('itemdb:import')->assertSuccessful();

        $this->get('/items/223')->assertOk()
            ->assertSee('<title>Kukuri (D-grade) — Stats, Drops and Where to Buy | L2 Kage</title>', false)
            ->assertSee('Kukuri: D-grade dagger. P. Atk. 56, M. Atk. 39, Atk. Spd. 433. Dropped by', false)
            ->assertSee('"@type":"BreadcrumbList"', false);
    }
}
