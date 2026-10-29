<?php

namespace Tests\Feature;

use App\Filament\Resources\PremiumAccounts\Pages\ListPremiumAccounts;
use App\Mail\AccountMail;
use App\Models\Game\Account;
use App\Models\GameAction;
use App\Models\User;
use App\Services\Premium;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Livewire\Livewire;
use Tests\TestCase;

class PremiumTest extends TestCase
{
    use RefreshDatabase;

    private string $configDir;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['game', 'login'] as $connection) {
            config(["database.connections.{$connection}" => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']]);
            DB::purge($connection);
        }
        Schema::connection('login')->create('accounts', function (Blueprint $table) {
            $table->string('login')->primary();
            $table->string('password');
            $table->string('email')->nullable();
            $table->integer('accessLevel')->default(0);
            $table->bigInteger('lastactive')->default(0);
            $table->timestamp('created_time')->nullable();
        });
        DB::connection('login')->table('accounts')->insert([['login' => 'hero', 'password' => 'x', 'email' => 'hero@example.com'], ['login' => 'oldtimer', 'password' => 'x', 'email' => null]]);
        Schema::connection('game')->create('account_premium', function (Blueprint $table) {
            $table->string('account_name')->primary();
            $table->bigInteger('enddate');
        });
        DB::connection('game')->table('account_premium')->insert([
            ['account_name' => 'hero', 'enddate' => now()->addDays(10)->getTimestampMs()],
            ['account_name' => 'oldtimer', 'enddate' => now()->subDays(3)->getTimestampMs()],
        ]);

        $this->configDir = sys_get_temp_dir().'/premium-test-'.uniqid();
        mkdir("{$this->configDir}/Custom", recursive: true);
        file_put_contents("{$this->configDir}/Custom/PremiumSystem.ini", "EnablePremiumSystem = True\nPremiumRateXp = 2\nPremiumRateSp = 2\nPremiumRateDropChance = 1\nPremiumRateDropAmount = 2\n");
        config(['l2j.config_dir' => $this->configDir, 'l2j.config_defaults_dir' => null]);
    }

    protected function tearDown(): void
    {
        unlink("{$this->configDir}/Custom/PremiumSystem.ini");
        rmdir("{$this->configDir}/Custom");
        rmdir($this->configDir);

        parent::tearDown();
    }

    public function test_the_config_says_whether_premium_is_on_and_what_it_gives(): void
    {
        $premium = app(Premium::class);

        $this->assertTrue($premium->enabled());
        $this->assertSame('XP x2, SP x2, Drop amount x2', $premium->bonuses());
    }

    public function test_granting_and_removing_queue_actions_for_the_game_server(): void
    {
        $grant = app(Premium::class)->grant('Hero', 30, 'admin (staff@example.com)');
        $remove = app(Premium::class)->remove('hero', 'admin (staff@example.com)');

        $this->assertSame([GameAction::ACTION_ADD_PREMIUM, 'hero', 30, GameAction::STATUS_PENDING], [$grant->action, $grant->character_name, $grant->count, $grant->fresh()->status]);
        $this->assertSame([GameAction::ACTION_REMOVE_PREMIUM, 'hero'], [$remove->action, $remove->character_name]);
    }

    public function test_staff_see_the_premium_accounts_and_whether_the_system_is_on(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/admin/premium-accounts')
            ->assertOk()
            ->assertSee('The premium system is on')
            ->assertSee('hero')
            ->assertSee('oldtimer')
            ->assertSee('Grant Premium');
    }

    public function test_staff_grant_premium_from_the_page_and_add_days_or_remove_it_per_row(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(ListPremiumAccounts::class)
            ->callAction('grant', data: ['account' => 'hero', 'days' => 30])
            ->assertHasNoActionErrors()
            ->callTableAction('addDays', 'hero', data: ['days' => 7])
            ->assertHasNoTableActionErrors()
            ->callTableAction('remove', 'oldtimer');

        $this->assertSame(
            [[GameAction::ACTION_ADD_PREMIUM, 'hero', 30], [GameAction::ACTION_ADD_PREMIUM, 'hero', 7], [GameAction::ACTION_REMOVE_PREMIUM, 'oldtimer', 1]],
            GameAction::orderBy('id')->get()->map(fn (GameAction $a): array => [$a->action, $a->character_name, $a->count])->all(),
        );
    }

    public function test_premium_players_see_their_blessing_on_every_page(): void
    {
        $this->actingAs(Account::findOrFail('hero'), 'player')->get('/lore')->assertOk()->assertInertia(fn ($page) => $page
            ->where('player.login', 'hero')
            ->where('player.premium.bonuses', 'XP x2, SP x2, Drop amount x2')
            ->has('player.premium.until'));

        // Ended premium shows nothing.
        $this->actingAs(Account::findOrFail('oldtimer'), 'player')->get('/lore')->assertInertia(fn ($page) => $page->where('player.premium', null));
    }

    public function test_granting_premium_emails_the_account_when_it_has_an_address(): void
    {
        Mail::fake();

        // hero has 10 days left: 30 more are added to them. oldtimer has no email: nothing is sent.
        app(Premium::class)->grant('hero', 30, 'admin (test)');
        app(Premium::class)->grant('oldtimer', 5, 'admin (test)');

        Mail::assertSent(AccountMail::class, 1);
        Mail::assertSent(AccountMail::class, function (AccountMail $mail): bool {
            $text = implode(' ', $mail->lines);

            return $mail->hasTo('hero@example.com')
                && str_contains($mail->title, 'Your blessing grows stronger')
                && str_contains($text, '30 more days have been added to your blessing, which now endures until '.now()->addDays(40)->format('j M Y'))
                && str_contains($text, 'XP x2, SP x2, Drop amount x2')
                && str_contains($text, 'Quantidade de drop x2');
        });
    }
}
