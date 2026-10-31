<?php

namespace Tests\Feature;

use App\Filament\Resources\NewsPosts\Pages\CreateNewsPost;
use App\Models\NewsPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class NewsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function newsPost(array $overrides = []): NewsPost
    {
        return NewsPost::create([
            'slug' => 'first-post',
            'category' => 'update',
            'title_en' => 'English title',
            'title_pt' => 'Título em português',
            'summary_en' => 'English summary',
            'summary_pt' => 'Resumo em português',
            'body_en' => 'English **text**',
            'body_pt' => 'Texto em **português**',
            'published_at' => now()->subHour(),
            ...$overrides,
        ]);
    }

    public function test_the_home_page_lists_the_latest_three_published_posts(): void
    {
        foreach (range(1, 4) as $i) {
            $this->newsPost(['slug' => "post-{$i}", 'published_at' => now()->subDays($i)]);
        }

        $this->newsPost(['slug' => 'draft', 'published_at' => null]);
        $this->newsPost(['slug' => 'scheduled', 'published_at' => now()->addDay()]);

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->has('news', 3)
            ->where('news.0.slug', 'post-1')
            ->where('news.2.slug', 'post-3'));
    }

    public function test_the_banner_shows_a_featured_post_until_its_end_date(): void
    {
        $post = $this->newsPost(['is_featured' => true, 'featured_until' => now()->addDay(), 'banner_theme' => 'halloween']);

        $this->get('/')->assertInertia(fn ($page) => $page->where('banner.slug', 'first-post')->where('banner.theme', 'halloween'));

        $post->update(['featured_until' => now()->subMinute()]);

        $this->get('/')->assertInertia(fn ($page) => $page->where('banner', null));
    }

    public function test_drafts_and_scheduled_posts_are_not_public(): void
    {
        $this->newsPost(['slug' => 'draft', 'published_at' => null]);
        $this->newsPost(['slug' => 'scheduled', 'published_at' => now()->addDay()]);

        $this->get('/news/draft')->assertNotFound();
        $this->get('/news/scheduled')->assertNotFound();
        $this->get('/news')->assertInertia(fn ($page) => $page->has('posts.data', 0));
    }

    public function test_the_news_page_filters_by_category(): void
    {
        $this->newsPost();
        $this->newsPost(['slug' => 'a-quest', 'category' => 'quest']);

        $this->get('/news?category=quest')->assertInertia(fn ($page) => $page
            ->where('category', 'quest')
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', 'a-quest'));
        $this->get('/news?category=nonsense')->assertInertia(fn ($page) => $page->where('category', null)->has('posts.data', 2));
    }

    public function test_a_post_is_shown_in_the_visitors_language(): void
    {
        $this->newsPost();

        $this->get('/news/first-post')->assertInertia(fn ($page) => $page->where('post.title', 'English title'));
        $this->withCookie('locale', 'pt_BR')->get('/news/first-post')
            ->assertInertia(fn ($page) => $page->where('post.title', 'Título em português'));
    }

    public function test_raw_html_in_a_post_is_removed(): void
    {
        $post = $this->newsPost(['body_en' => "Hello **hero**\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))"]);

        $html = $post->bodyHtml();

        $this->assertStringContainsString('<strong>hero</strong>', $html);
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringNotContainsString('javascript:', $html);
    }

    public function test_published_posts_are_in_the_sitemap(): void
    {
        $this->newsPost();
        $this->newsPost(['slug' => 'draft', 'published_at' => null]);

        $this->get('/sitemap.xml')->assertOk()->assertSee('/news/first-post')->assertDontSee('/news/draft');
    }

    public function test_an_admin_can_create_a_post(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(CreateNewsPost::class)
            ->fillForm([
                'category' => 'event',
                'slug' => 'new-event',
                'title_en' => 'New event',
                'summary_en' => 'Summary',
                'body_en' => 'Text',
                'title_pt' => 'Novo evento',
                'summary_pt' => 'Resumo',
                'body_pt' => 'Texto',
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('news_posts', ['slug' => 'new-event', 'published_at' => null]);
    }
}
