<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_english_is_the_default(): void
    {
        $this->get('/lore')->assertOk()
            ->assertSee('<html lang="en">', false)
            ->assertSee('<title>Lore of Aden: Lineage II History to Essence Samurai Crow | L2 Kage</title>', false)
            ->assertInertia(fn ($page) => $page->where('locale', 'en'));
    }

    public function test_portuguese_browsers_get_portuguese(): void
    {
        $this->withHeader('Accept-Language', 'pt-BR,pt;q=0.9,en;q=0.8')->get('/lore')->assertOk()
            ->assertSee('<html lang="pt-BR">', false)
            ->assertSee('<title>História de Aden: Lineage II até o Essence Samurai Crow | L2 Kage</title>', false)
            ->assertInertia(fn ($page) => $page->where('locale', 'pt_BR'));
    }

    public function test_the_switch_remembers_the_choice_over_the_browser_language(): void
    {
        $this->from('/about')->get('/locale/pt_BR')->assertRedirect('/about')->assertCookie('locale', 'pt_BR');

        $this->withCookie('locale', 'en')->withHeader('Accept-Language', 'pt-BR')->get('/')
            ->assertInertia(fn ($page) => $page->where('locale', 'en'));
        $this->withCookie('locale', 'pt_BR')->get('/')
            ->assertSee('<title>L2 Kage — Servidor Gratuito de Lineage II Essence</title>', false)
            ->assertInertia(fn ($page) => $page->where('locale', 'pt_BR'));
    }

    public function test_unknown_languages_are_not_accepted(): void
    {
        $this->get('/locale/fr')->assertNotFound();
    }

    public function test_form_errors_follow_the_language(): void
    {
        $this->withCookie('locale', 'pt_BR')->from('/account')->post('/account/login', ['login' => '', 'password' => ''])
            ->assertSessionHasErrors(['login' => 'Digite o nome da sua conta do jogo.']);
    }
}
