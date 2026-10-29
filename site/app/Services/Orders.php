<?php

namespace App\Services;

use App\Mail\AccountMail;
use App\Models\Game\Account;
use App\Models\GameAction;
use App\Models\GiftClaim;
use App\Models\PackageClaim;
use App\Models\PassClaim;
use App\Services\L2j\GameData;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * A game account's orders: everything it claimed or bought in the store (weekly gift boxes, Kage Passes, class
 * packages), as one history for the player area's Orders tab, plus the store checkout's data and the confirmation
 * email. Each kind keeps its own table (gift_claims, pass_claims, package_claims) and its in-game delivery
 * (game_actions); this service only reads them. A new kind of order (e.g. a contribution to the server that adds
 * L-Coin) adds its source to history() and, when it is bought on the website, calls confirm().
 */
class Orders
{
    public function __construct(private GameData $gameData, private KagePass $pass, private ClassPackages $packages) {}

    /**
     * Every order, newest first. The items are what was actually sent (the in-game action), so they stay right
     * after the store's config changes.
     *
     * @return list<array{id: string, type: string, name: array{en: string, pt: string}, characterName: string, price: array{count: int, currency: string}|null, status: string, createdAt: string, items: list<array{name: string, count: int, enchant: int}>}>
     */
    public function history(Account $account): array
    {
        $gifts = GiftClaim::with('gameAction')->where('account', $account->login)->get()->map(fn (GiftClaim $claim): array => [
            'id' => "gift-{$claim->id}",
            'type' => 'gift',
            'name' => ['en' => 'Weekly Gift Box', 'pt' => 'Caixa de Presente Semanal'],
            'characterName' => $claim->character_name,
            'price' => null,
            'status' => $claim->gameAction->status ?? GameAction::STATUS_FAILED,
            'createdAt' => $claim->created_at->toIso8601String(),
            'items' => array_map(fn (array $item): array => ['name' => $item['name'], 'count' => (int) $item['count'], 'enchant' => 0], $claim->items ?? []),
        ]);

        $passes = PassClaim::with('gameAction')->where('account', $account->login)->get()->map(fn (PassClaim $claim): array => [
            'id' => "pass-{$claim->id}",
            'type' => 'pass',
            'name' => ['en' => $name = $claim->gameAction->item_name ?? 'Kage Pass', 'pt' => $name],
            ...$this->purchase($claim->gameAction, $claim->character_name, $claim->created_at->toIso8601String()),
        ]);

        $packages = PackageClaim::with('gameAction')->where('account', $account->login)->get()->map(fn (PackageClaim $claim): array => [
            'id' => "package-{$claim->id}",
            'type' => 'package',
            'name' => $this->packageName($claim->package),
            ...$this->purchase($claim->gameAction, $claim->character_name, $claim->created_at->toIso8601String()),
        ]);

        return $gifts->concat($passes)->concat($packages)->sortByDesc('createdAt')->values()->all();
    }

    /**
     * What the store page's checkout needs for a signed-in player: the characters that can pay (with their L-Coin in
     * the bag and suggested archetype) and what this season already holds (the Kage Pass, packages bought).
     *
     * @return array{characters: list<array<string, mixed>>, passClaimed: bool, packagesBought: list<string>}
     */
    public function checkout(Account $account): array
    {
        $packages = $this->packages->status($account);
        $passClaim = $this->pass->status($account)['claim'];

        return [
            'characters' => $packages['characters'],
            'passClaimed' => $passClaim !== null && $passClaim['status'] !== GameAction::STATUS_FAILED,
            'packagesBought' => array_values(array_map(
                fn (array $claim): string => $claim['package'],
                array_filter($packages['claims'], fn (array $claim): bool => $claim['status'] !== GameAction::STATUS_FAILED),
            )),
        ];
    }

    /**
     * Emails the order confirmation to the account's address, when it has one and email is set up. A failed send is
     * logged, never shown: the order itself is already placed.
     */
    public function confirm(Account $account, string $name, int $price, string $characterName, GameAction $action): void
    {
        if (! $account->email || ! GameAccounts::emailReady()) {
            return;
        }

        $items = implode(', ', array_map(
            fn (array $item): string => ($item['enchant'] ? "+{$item['enchant']} " : '').$item['name'].($item['count'] > 1 ? ' x'.number_format($item['count']) : ''),
            $this->items($action),
        ));

        try {
            Mail::to($account->email)->send(new AccountMail(
                __('Order placed'),
                [
                    __('Thank you for your order, :login.', ['login' => $account->login]),
                    __(':name for :price L-Coin, paid from :character\'s bag.', ['name' => $name, 'price' => number_format($price), 'character' => $characterName]),
                    __('Items: :items.', ['items' => $items]),
                    __('The game server takes the L-Coin and mails the items to :character within seconds. If the character no longer has enough L-Coin by then, nothing is taken and the order shows as failed.', ['character' => $characterName]),
                ],
                [['label' => __('See your orders'), 'url' => route('account.orders')]],
                [__('You get this email because an order was placed with your game account on :site.', ['site' => config('l2j.server_name')])],
            ));
        } catch (\Throwable $e) {
            Log::warning('Order confirmation email failed.', ['account' => $account->login, 'error' => $e->getMessage()]);
        }
    }

    /**
     * The price, character, delivery status, date and items of a purchase (Kage Pass, class package).
     *
     * @return array{characterName: string, price: array{count: int, currency: string}|null, status: string, createdAt: string, items: list<array{name: string, count: int, enchant: int}>}
     */
    private function purchase(?GameAction $action, string $characterName, string $createdAt): array
    {
        return [
            'characterName' => $characterName,
            'price' => $action ? ['count' => $action->count, 'currency' => $this->gameData->item((int) $action->item_id)['name']] : null,
            'status' => $action->status ?? GameAction::STATUS_FAILED,
            'createdAt' => $createdAt,
            'items' => $action ? $this->items($action) : [],
        ];
    }

    /**
     * The items an in-game action sends ("itemId:count:enchant" entries joined by ";").
     *
     * @return list<array{name: string, count: int, enchant: int}>
     */
    private function items(GameAction $action): array
    {
        return array_values(array_map(function (string $entry): array {
            [$id, $count, $enchant] = array_map('intval', explode(':', $entry)) + [0, 1, 0];

            return ['name' => $this->gameData->item($id)['name'], 'count' => $count, 'enchant' => $enchant];
        }, array_filter(explode(';', (string) $action->items))));
    }

    /**
     * "Knight · Elite" from "elite:knight", in both languages.
     *
     * @return array{en: string, pt: string}
     */
    private function packageName(string $package): array
    {
        [$tier, $archetype] = explode(':', $package) + ['', ''];
        $tierName = config("l2j.packages.tiers.{$tier}.name") ?? ['en' => $tier, 'pt' => $tier];
        $archetypeName = config("l2j.packages.archetypes.{$archetype}.name") ?? ['en' => $archetype, 'pt' => $archetype];

        return ['en' => "{$archetypeName['en']} · {$tierName['en']}", 'pt' => "{$archetypeName['pt']} · {$tierName['pt']}"];
    }
}
