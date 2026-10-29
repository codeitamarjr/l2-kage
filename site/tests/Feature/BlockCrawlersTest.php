<?php

namespace Tests\Feature;

use Tests\TestCase;

class BlockCrawlersTest extends TestCase
{
    public function test_ai_bots_and_scrapers_get_a_403(): void
    {
        foreach (['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'CCBot/2.0 (https://commoncrawl.org/faq/)', 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'] as $agent) {
            $this->withHeader('User-Agent', $agent)->get('/lore')->assertForbidden();
        }
    }

    public function test_search_engines_link_previews_and_people_get_through(): void
    {
        foreach (['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)', 'facebookexternalhit/1.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'] as $agent) {
            $this->withHeader('User-Agent', $agent)->get('/lore')->assertOk();
        }
    }

    public function test_robots_txt_stays_readable_and_disallows_the_ai_bots(): void
    {
        $this->withHeader('User-Agent', 'GPTBot/1.2')->get('/robots.txt')
            ->assertOk()
            ->assertSee("User-agent: GPTBot\n", false)
            ->assertSee("User-agent: Google-Extended\n", false)
            ->assertSee("Disallow: /\n", false)
            ->assertSee("User-agent: *\nAllow: /\n", false);
    }

    public function test_pages_opt_out_of_ai_training(): void
    {
        $this->get('/lore')->assertSee('noai, noimageai', false)->assertSee('<meta name="tdm-reservation" content="1">', false);
    }
}
