<?php

namespace Tests\Feature;

use App\Auth\GameAccountUserProvider;
use App\Mail\AccountMail;
use App\Models\Game\Account;
use App\Services\GameAccounts;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class GameAccountsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        config(['database.connections.login' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']]);
        DB::purge('login');
        Schema::connection('login')->create('accounts', function (Blueprint $table) {
            $table->string('login')->primary();
            $table->string('password')->nullable();
            $table->string('email')->nullable();
            $table->integer('accessLevel')->default(0);
            $table->bigInteger('lastactive')->default(0);
            $table->timestamp('created_time')->nullable();
        });
        $this->account('hero', 'secret1', 'hero@example.com');
    }

    private function account(string $login, string $password, ?string $email = null): void
    {
        DB::connection('login')->table('accounts')->insert(['login' => $login, 'password' => GameAccountUserProvider::hash($password), 'email' => $email]);
    }

    private function row(string $login): ?object
    {
        return DB::connection('login')->table('accounts')->where('login', $login)->first();
    }

    /** The link of the last email of that title (or its first button). */
    private function link(string $title, int $button = 0): string
    {
        $url = null;
        Mail::assertSent(AccountMail::class, function (AccountMail $mail) use ($title, $button, &$url): bool {
            if ($mail->title === $title) {
                $url = $mail->actions[$button]['url'];
            }

            return $mail->title === $title;
        });

        return parse_url($url, PHP_URL_PATH);
    }

    private function register(array $overrides = []): TestResponse
    {
        return $this->post('/register', [
            'login' => 'Newbie', 'email' => 'New@Example.com', 'password' => 'p4ssword', 'password_confirmation' => 'p4ssword', ...$overrides,
        ]);
    }

    public function test_registration_creates_the_account_only_after_the_email_is_confirmed(): void
    {
        $this->register()->assertRedirect('/register')->assertSessionHas('status', 'registration-sent');

        $this->assertNull($this->row('newbie'), 'no account before confirming');
        Mail::assertSent(AccountMail::class, fn (AccountMail $mail): bool => $mail->hasTo('new@example.com'));

        $link = $this->link('Confirm your account');
        $this->get($link)->assertRedirect('/account')->assertSessionHas('status', 'account-created');

        $row = $this->row('newbie');
        $this->assertSame('new@example.com', $row->email);
        $this->assertSame(GameAccountUserProvider::hash('p4ssword'), $row->password, 'stored the L2J way, lowercased name');
        $this->assertAuthenticatedAs(Account::find('newbie'), 'player');

        $this->get($link)->assertRedirect('/register')->assertSessionHas('status', 'link-invalid');
    }

    public function test_registration_rules(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class); // more tries than the real limit

        $this->register(['login' => 'hero'])->assertSessionHasErrors('login');            // existing account
        $this->register(['login' => 'ab'])->assertSessionHasErrors('login');              // too short
        $this->register(['login' => 'has space'])->assertSessionHasErrors('login');
        $this->register(['login' => 'abcdefghijklmno'])->assertSessionHasErrors('login'); // 15 > 14
        $this->register(['password' => 'p4ss word', 'password_confirmation' => 'p4ss word'])->assertSessionHasErrors('password');
        $this->register(['password' => str_repeat('a', 17), 'password_confirmation' => str_repeat('a', 17)])->assertSessionHasErrors('password');
        $this->register(['password_confirmation' => 'other123'])->assertSessionHasErrors('password');

        $this->register(['login' => 'first'])->assertSessionHasNoErrors();
        $this->register(['login' => 'FIRST'])->assertSessionHasErrors('login'); // waiting for confirmation counts as taken
    }

    public function test_an_email_can_hold_only_so_many_accounts(): void
    {
        config(['l2j.accounts.max_per_email' => 2]);

        $this->register(['login' => 'alt1', 'email' => 'hero@example.com'])->assertSessionHasNoErrors(); // hero + 1 pending
        $this->register(['login' => 'alt2', 'email' => 'hero@example.com'])->assertSessionHasErrors('email');
    }

    public function test_forgot_password_sends_one_link_per_account_and_reveals_nothing(): void
    {
        $this->account('heroalt', 'secret2', 'hero@example.com');

        $this->post('/forgot-password', ['email' => 'nobody@example.com'])->assertRedirect('/forgot-password')->assertSessionHas('status', 'reset-sent');
        Mail::assertNothingSent();

        $this->post('/forgot-password', ['email' => 'HERO@example.com'])->assertSessionHas('status', 'reset-sent');
        Mail::assertSent(AccountMail::class, fn (AccountMail $mail): bool => count($mail->actions) === 2);

        $link = $this->link('Reset your password', 1); // hero, heroalt (by name): the second is heroalt
        $this->get($link)->assertOk()->assertInertia(fn ($page) => $page->component('reset-password')->where('login', 'heroalt'));
        $this->post($link, ['password' => 'brandnew1', 'password_confirmation' => 'brandnew1'])->assertRedirect('/account');

        $this->assertSame(GameAccountUserProvider::hash('brandnew1'), $this->row('heroalt')->password);
        $this->assertSame(GameAccountUserProvider::hash('secret1'), $this->row('hero')->password, 'other account untouched');
        $this->get($link)->assertRedirect('/forgot-password'); // single use
    }

    public function test_reset_links_expire(): void
    {
        $this->post('/forgot-password', ['email' => 'hero@example.com']);
        $link = $this->link('Reset your password');

        $this->travel(61)->minutes();
        $this->post($link, ['password' => 'brandnew1', 'password_confirmation' => 'brandnew1'])->assertSessionHas('status', 'link-invalid');
        $this->assertSame(GameAccountUserProvider::hash('secret1'), $this->row('hero')->password);
    }

    public function test_players_change_their_password_and_email(): void
    {
        $hero = Account::find('hero');

        $this->actingAs($hero, 'player')->post('/account/password', ['current_password' => 'wrong', 'password' => 'newpass1', 'password_confirmation' => 'newpass1'])
            ->assertSessionHasErrors('current_password');
        $this->actingAs($hero, 'player')->post('/account/password', ['current_password' => 'secret1', 'password' => 'newpass1', 'password_confirmation' => 'newpass1'])
            ->assertSessionHas('status', 'password-changed');
        $this->assertSame(GameAccountUserProvider::hash('newpass1'), $this->row('hero')->password);

        $hero = Account::find('hero');
        $this->actingAs($hero, 'player')->post('/account/email', ['email' => 'Hero2@Example.com', 'email_password' => 'newpass1'])
            ->assertSessionHas('status', 'email-sent');
        $this->assertSame('hero@example.com', $this->row('hero')->email, 'unchanged until confirmed');

        $this->get($this->link('Confirm your email'))->assertRedirect('/account/security');
        $this->assertSame('hero2@example.com', $this->row('hero')->email);
    }

    public function test_the_bot_check_blocks_registration_when_turnstile_is_on(): void
    {
        config(['services.turnstile.site_key' => 'site', 'services.turnstile.secret_key' => 'secret']);
        Http::fake(['challenges.cloudflare.com/*' => Http::sequence()->push(['success' => false])->push(['success' => true])]);

        $this->register(['cf-turnstile-response' => 'bad'])->assertSessionHasErrors('cf-turnstile-response');
        Mail::assertNothingSent();

        $this->register(['cf-turnstile-response' => 'good'])->assertSessionHasNoErrors();
    }

    public function test_security_tab_has_its_own_address(): void
    {
        $this->actingAs(Account::find('hero'), 'player')->get('/account/security')->assertOk()
            ->assertInertia(fn ($page) => $page->component('account')->where('tab', 'security')->where('account.email', 'hero@example.com')->missing('characters'));
    }

    public function test_in_production_registration_opens_only_with_a_working_mailer(): void
    {
        $this->app['env'] = 'production';

        config(['mail.default' => 'log']);
        $this->assertFalse(GameAccounts::emailReady(), 'no email service yet');

        config(['mail.default' => 'smtp', 'mail.mailers.smtp.username' => null, 'mail.mailers.smtp.password' => null]);
        $this->assertFalse(GameAccounts::emailReady(), 'SMTP without credentials');

        config(['mail.mailers.smtp.username' => 'AKIA...', 'mail.mailers.smtp.password' => 'secret']);
        $this->assertTrue(GameAccounts::emailReady());
    }
}
