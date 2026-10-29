<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\ClassPackages;
use App\Services\GiftBox;
use App\Services\KagePass;
use App\Services\L2j\EventFeed;
use App\Services\L2j\GameConfig;
use App\Services\L2j\GameData;
use App\Services\L2j\ServerStatus;
use App\Services\L2j\WorldMap;
use App\Services\Orders;
use App\Services\Seo;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public pages. Live data is passed as closures so the pages' polling (only: [...]) reloads just those props.
 * Game-database reads are rescued (logged, then null) so the pages still render when the game DB is down.
 */
class PageController extends Controller
{
    public function home(EventFeed $events, ServerStatus $status, KagePass $pass, ClassPackages $packages): Response
    {
        $rates = $status->rates();
        $brand = Seo::brand();

        return Inertia::render('home', [
            'events' => fn (): ?array => rescue(fn (): array => $events->get()),
            'rates' => $rates,
            // The store section: the weekly gift box, the Kage Pass and the class packages.
            'pass' => $pass->offer(),
            'packages' => $packages->offer(),
            'giftMinLevel' => (int) config('l2j.gift_box.min_level'),
            'seo' => Seo::make(
                null,
                __(':brand: a free Lineage II Essence server on the Samurai Crow update. x:xp XP, x:drop drop, x:adena Adena. Live bosses and sieges, a world map and an item database. Join now.', [
                    'brand' => $brand, 'xp' => $rates['xp'], 'drop' => $rates['drop'], 'adena' => $rates['adena'],
                ]),
                jsonLd: [[
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => $brand,
                    'url' => url('/'),
                    'potentialAction' => [
                        '@type' => 'SearchAction',
                        'target' => ['@type' => 'EntryPoint', 'urlTemplate' => url('/items').'?q={search_term_string}'],
                        'query-input' => 'required name=search_term_string',
                    ],
                ]],
            ),
        ]);
    }

    public function lore(): Response
    {
        return Inertia::render('lore', [
            'seo' => Seo::make(
                __('Lore of Aden: Lineage II History to Essence Samurai Crow'),
                __('The history of Aden from Einhasad and Gran Kain, the Giants and Shilen\'s betrayal to Essence: the Sylphs, the Warg, the Blood Rose and the Kamael Samurai.'),
            ),
        ]);
    }

    public function map(EventFeed $events, WorldMap $map): Response
    {
        return Inertia::render('map', [
            'events' => fn (): ?array => rescue(fn (): array => $events->get()),
            'map' => fn (): ?array => rescue(fn (): array => $map->get()),
            'seo' => Seo::make(
                __('Live World Map of Aden'),
                __('Live map of Aden: epic and raid bosses, castle sieges, the Grand Olympiad and events, plotted where they happen, with the story of every place.'),
            ),
        ]);
    }

    /**
     * The Treasury (gifts, passes and packages): where L-Coin comes from (welcome gift, weekly gift box), the Kage Pass (website), the in-game Hunt Pass
     * and the class packages. Rules come from the server's config and the datapack (HuntPass.ini, HuntPass.xml);
     * signed-in players buy the pass and packages right here (checkout), and open the gift box in their Orders tab.
     */
    public function treasury(KagePass $pass, ClassPackages $packages, Orders $orders, GameConfig $config, GameData $gameData, GiftBox $giftBox): Response
    {
        $huntPass = $gameData->huntPass();
        $premiumItem = (int) $config->number('HuntPass.ini', 'PremiumItemId', 91663);
        $gift = $giftBox->contents();
        $giftLCoin = collect($gift['guaranteed'])->firstWhere('name', $gameData->item(91663)['name']);

        return Inertia::render('treasury', [
            'pass' => $pass->offer(),
            'packages' => $packages->offer(),
            'gift' => [...$gift, 'minLevel' => (int) config('l2j.gift_box.min_level')],
            // Signed in: the characters that can pay, and what this season already holds.
            'checkout' => function () use ($orders): ?array {
                /** @var Account|null $account */
                $account = Auth::guard('player')->user();

                return $account ? $orders->checkout($account) : null;
            },
            'hunt' => [
                'enabled' => $config->flag('HuntPass.ini', 'EnabledHuntPass', false),
                'pointsForStep' => (int) $config->number('HuntPass.ini', 'PointsForStep', 2400),
                'premium' => ['name' => $gameData->item($premiumItem)['name'], 'count' => (int) $config->number('HuntPass.ini', 'PremiumItemCount', 3600)],
                'resetDay' => (int) $config->number('HuntPass.ini', 'DayOfMonth', 1),
                'steps' => count($huntPass),
                'firstSteps' => array_slice($huntPass, 0, 10),
            ],
            'lcoin' => [
                'welcome' => (int) config('l2j.welcome_lcoin'),
                'giftBox' => $giftLCoin ? (int) $giftLCoin['count'] : 0,
            ],
            'seo' => Seo::make(
                __('Treasury: weekly gift box, Kage Pass and class packages'),
                __('The L2 Kage Treasury: a free weekly gift box, the Kage Pass and the in-game Hunt Pass, and full class gear packages, paid with L-Coin.'),
            ),
        ]);
    }

    public function about(ServerStatus $status, EventFeed $events): Response
    {
        return Inertia::render('about', [
            'status' => fn (): array => $status->get(),
            'events' => fn (): ?array => rescue(fn (): array => $events->get()),
            'seo' => Seo::make(
                __('Server Status, Rates and Rankings'),
                __('Live status of the :brand Lineage II Essence server: players online, rates, top players, castle owners, boss timers and upcoming sieges. How to connect.', ['brand' => Seo::brand()]),
            ),
        ]);
    }
}
