<?php

namespace App\Services;

use App\Mail\AccountMail;
use App\Models\Game\Account;
use App\Models\Game\PremiumAccount;
use App\Models\GameAction;
use App\Services\L2j\GameConfig;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Premium accounts (the game's PremiumSystem.ini): XP, SP, drop and spoil bonuses for an account for a time. The admin
 * grants or removes premium here; the WebBridge inside the game server applies it (add_premium / remove_premium), so
 * an online account gets or loses it at once. Turning the system on or off is a game config change (overrides/game/
 * config/Custom/PremiumSystem.ini) and needs a game server restart.
 */
class Premium
{
    public function __construct(private GameConfig $config) {}

    public function enabled(): bool
    {
        return $this->config->flag('Custom/PremiumSystem.ini', 'EnablePremiumSystem', false);
    }

    /**
     * When an account's premium ends, or null when the system is off or it has none (or it ended). A game database
     * problem counts as none, so pages still render.
     */
    public function until(string $login): ?Carbon
    {
        if (! $this->enabled()) {
            return null;
        }

        $end = rescue(fn (): ?Carbon => PremiumAccount::query()->find(strtolower($login))?->endsAt(), report: false);

        return $end?->isFuture() ? $end : null;
    }

    /**
     * The bonuses premium gives, from the config: "XP x2, SP x2, ...".
     */
    public function bonuses(): string
    {
        $rates = [
            'XP' => 'PremiumRateXp', 'SP' => 'PremiumRateSp', 'Drop chance' => 'PremiumRateDropChance', 'Drop amount' => 'PremiumRateDropAmount',
            'Spoil chance' => 'PremiumRateSpoilChance', 'Spoil amount' => 'PremiumRateSpoilAmount',
        ];

        $bonuses = [];
        foreach ($rates as $label => $key) {
            $rate = $this->config->number('Custom/PremiumSystem.ini', $key, 1);
            if ($rate != 1) {
                $bonuses[] = __($label).' x'.rtrim(rtrim(number_format($rate, 2), '0'), '.');
            }
        }

        return $bonuses ? implode(', ', $bonuses) : __('no rate bonuses');
    }

    /** Queues days of premium for an account (added to what it has left). */
    public function grant(string $account, int $days, string $requestedBy, ?string $note = null): GameAction
    {
        // The game adds the days to what is left (or to now when it has none); the email shows the same end date.
        $current = rescue(fn (): ?Carbon => PremiumAccount::query()->find(strtolower($account))?->endsAt(), report: false);
        $ends = ($current?->isFuture() ? $current : now())->copy()->addDays($days);

        $action = GameAction::create([
            'action' => GameAction::ACTION_ADD_PREMIUM,
            'character_id' => 0,
            'character_name' => strtolower($account),
            'item_name' => 'Premium account',
            'count' => $days,
            'note' => $note ?? "{$days} premium day(s)",
            'requested_by' => $requestedBy,
        ]);

        $this->notify($account, $days, $ends, extended: $current?->isFuture() ?? false);

        return $action;
    }

    /**
     * Emails the account that premium was granted or extended, when it has an address and email is set up: in both
     * of the site's languages (the admin doesn't know the player's), in the voice of the lore. A failed send is
     * logged, never shown: the premium itself is already on its way.
     */
    private function notify(string $login, int $days, Carbon $ends, bool $extended): void
    {
        $email = rescue(fn (): ?string => Account::query()->find($login)?->email, report: false);

        if (! $email || ! GameAccounts::emailReady()) {
            return;
        }

        $until = $ends->format('j M Y');
        $untilPt = $ends->locale('pt_BR')->translatedFormat('j \\d\\e F \\d\\e Y');
        $dayWord = $days === 1 ? 'day' : 'days';
        $diaWord = $days === 1 ? 'dia' : 'dias';
        $bonuses = $this->bonuses();
        $site = config('l2j.server_name');

        try {
            Mail::to($email)->send(new AccountMail(
                $extended ? 'Your blessing grows stronger · Sua bênção se fortalece' : 'The blessing of Einhasad · A bênção de Einhasad',
                [
                    $extended
                        ? "Hail, {$login}. The Goddess of Light has looked upon your deeds once more: {$days} more {$dayWord} have been added to your blessing, which now endures until {$until}."
                        : "Hail, {$login}. The Goddess of Light has marked your name: your account is blessed with premium for {$days} {$dayWord}, until {$until}.",
                    "Under her light, every one of your characters gains: {$bonuses}. It takes hold the moment you enter the world.",
                    $extended
                        ? "Salve, {$login}. A Deusa da Luz voltou os olhos para os seus feitos: mais {$days} {$diaWord} foram somados à sua bênção, que agora dura até {$untilPt}."
                        : "Salve, {$login}. A Deusa da Luz marcou o seu nome: sua conta foi abençoada com premium por {$days} {$diaWord}, até {$untilPt}.",
                    'Sob a luz dela, cada um dos seus personagens recebe: '.$this->bonusesIn('pt_BR').'. A bênção vale assim que você entrar no mundo.',
                ],
                [['label' => 'See your account · Ver sua conta', 'url' => route('account')]],
                ["You get this email because premium was granted to your game account on {$site}. · Você recebeu este e-mail porque premium foi concedido à sua conta do jogo no {$site}."],
            ));
        } catch (\Throwable $e) {
            Log::warning('Premium email failed.', ['account' => $login, 'error' => $e->getMessage()]);
        }
    }

    /** bonuses() in another of the site's languages. */
    private function bonusesIn(string $locale): string
    {
        $previous = app()->getLocale();
        app()->setLocale($locale);

        try {
            return $this->bonuses();
        } finally {
            app()->setLocale($previous);
        }
    }

    /** Queues the end of an account's premium. */
    public function remove(string $account, string $requestedBy): GameAction
    {
        return GameAction::create([
            'action' => GameAction::ACTION_REMOVE_PREMIUM,
            'character_id' => 0,
            'character_name' => strtolower($account),
            'item_name' => 'Premium account',
            'count' => 1,
            'note' => 'Premium removed',
            'requested_by' => $requestedBy,
        ]);
    }
}
