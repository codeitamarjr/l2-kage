<?php

namespace App\Services\L2j;

use App\Models\Game\Account;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * A player's characters, their status and items, read-only. Every query is scoped to the signed-in
 * account's login, so players can only ever see their own characters.
 */
class CharacterSheet
{
    /** Paperdoll slot numbers (Inventory.PAPERDOLL_* in L2J Mobius Essence); 38+ are the artifact slots. */
    private const SLOTS = [
        'Underwear', 'Head', 'Hair', 'Hair 2', 'Necklace', 'Weapon', 'Chest', 'Shield', 'Right Earring', 'Left Earring',
        'Gloves', 'Legs', 'Feet', 'Right Ring', 'Left Ring', 'Left Bracelet', 'Right Bracelet',
        'Agathion 1', 'Agathion 2', 'Agathion 3', 'Agathion 4', 'Agathion 5',
        'Talisman 1', 'Talisman 2', 'Talisman 3', 'Talisman 4', 'Talisman 5', 'Talisman 6', 'Cloak', 'Belt',
        'Brooch', 'Brooch Jewel 1', 'Brooch Jewel 2', 'Brooch Jewel 3', 'Brooch Jewel 4', 'Brooch Jewel 5', 'Brooch Jewel 6',
        'Artifact Book',
    ];

    private const SUMMARY_COLUMNS = [
        'c.charId', 'c.char_name', 'c.title', 'c.level', 'c.classid', 'c.base_class', 'c.race', 'c.sex', 'c.online',
        'c.nobless', 'c.accesslevel', 'c.lastAccess', 'c.deletetime', 'cd.clan_name', 'cd.clan_level',
    ];

    /** @var array<int, array<string, mixed>> Item database entries (kind, category, icon) for the items being listed. */
    private array $catalog = [];

    public function __construct(private GameData $gameData, private ItemDatabase $itemDatabase) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function characters(Account $account): array
    {
        return $this->query()
            ->where('c.account_name', $account->login)
            ->orderBy('c.char_slot')->orderBy('c.charId')
            ->get(self::SUMMARY_COLUMNS)
            ->map(fn (object $c): array => $this->summary($c))
            ->all();
    }

    /**
     * Status and items of one of the account's characters, or null if it isn't theirs.
     *
     * @return array<string, mixed>|null
     */
    public function character(Account $account, int $characterId): ?array
    {
        $c = $this->query()
            ->where('c.charId', $characterId)
            ->where('c.account_name', $account->login)
            ->first([...self::SUMMARY_COLUMNS, 'c.exp', 'c.sp', 'c.curHp', 'c.maxHp', 'c.curMp', 'c.maxMp', 'c.curCp', 'c.maxCp',
                'c.reputation', 'c.fame', 'c.pvpkills', 'c.pkkills', 'c.onlinetime', 'c.createDate', 'c.vitality_points']);

        if ($c === null) {
            return null;
        }

        $rows = DB::connection('game')->table('items')
            ->where('owner_id', $characterId)
            ->whereIn('loc', ['PAPERDOLL', 'INVENTORY', 'WAREHOUSE'])
            ->get(['object_id', 'item_id', 'count', 'enchant_level', 'loc', 'loc_data']);
        $this->catalog = $this->itemDatabase->summaries($rows->pluck('item_id')->map(fn ($id): int => (int) $id)->all());

        $equipped = $rows->where('loc', 'PAPERDOLL')->sortBy('loc_data')
            ->map(fn (object $r): array => ['slot' => self::SLOTS[(int) $r->loc_data] ?? 'Artifact', ...$this->item($r)])
            ->values()->all();
        $inventory = $this->sortItems($rows->where('loc', 'INVENTORY')->map(fn (object $r): array => $this->item($r))->all());
        $warehouse = $this->sortItems($rows->where('loc', 'WAREHOUSE')->map(fn (object $r): array => $this->item($r))->all());
        $exp = (int) $c->exp;
        $adena = collect($inventory)->firstWhere('itemId', 57);

        return [
            ...$this->summary($c),
            'clanLevel' => $c->clan_level !== null ? (int) $c->clan_level : null,
            'status' => [
                'hp' => ['current' => (int) round((float) $c->curHp), 'max' => (int) $c->maxHp],
                'mp' => ['current' => (int) round((float) $c->curMp), 'max' => (int) $c->maxMp],
                'cp' => ['current' => (int) round((float) $c->curCp), 'max' => (int) $c->maxCp],
                'exp' => $exp,
                'expPercent' => $this->expPercent((int) $c->level, $exp),
                'sp' => (int) $c->sp,
                'karma' => (int) $c->reputation,
                'fame' => (int) $c->fame,
                'pvp' => (int) $c->pvpkills,
                'pk' => (int) $c->pkkills,
                'vitality' => (int) $c->vitality_points,
                'onlineSeconds' => (int) $c->onlinetime,
                'created' => $c->createDate,
            ],
            'adena' => (int) ($adena['count'] ?? 0),
            'items' => ['equipped' => $equipped, 'inventory' => $inventory, 'warehouse' => $warehouse],
        ];
    }

    private function query(): Builder
    {
        return DB::connection('game')->table('characters as c')
            ->leftJoin('clan_data as cd', 'cd.clan_id', '=', 'c.clanid');
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(object $c): array
    {
        return [
            'id' => (int) $c->charId,
            'name' => $c->char_name,
            'title' => $c->title ?: null,
            'level' => (int) $c->level,
            'className' => $this->gameData->className((int) $c->classid),
            'baseClassName' => (int) $c->base_class !== (int) $c->classid ? $this->gameData->className((int) $c->base_class) : null,
            'race' => ServerStatus::RACES[(int) $c->race] ?? 'Unknown',
            'sex' => (int) $c->sex === 1 ? 'Female' : 'Male',
            'online' => (int) $c->online === 1,
            'clan' => $c->clan_name,
            'noblesse' => (int) $c->nobless === 1,
            'gm' => (int) $c->accesslevel > 0,
            'lastSeen' => $c->lastAccess ? date(DATE_ATOM, intdiv((int) $c->lastAccess, 1000)) : null,
            'deleting' => (int) $c->deletetime > 0,
        ];
    }

    /**
     * @return array{id: int, itemId: int, name: string, type: string, grade: string|null, kind: string, category: string, icon: string|null, count: int, enchant: int}
     */
    private function item(object $row): array
    {
        $item = $this->gameData->item((int) $row->item_id);
        $entry = $this->catalog[(int) $row->item_id] ?? null;

        return [
            'id' => (int) $row->object_id,
            'itemId' => (int) $row->item_id,
            'name' => $item['name'],
            'type' => $item['type'],
            'grade' => $item['grade'],
            // For the item icon (the database has the kind; without it, a generic icon).
            'kind' => $entry['kind'] ?? 'other',
            'category' => $entry['category'] ?? match ($item['type']) {
                'Weapon' => 'weapon', 'Armor' => 'armor', default => 'etc'
            },
            'icon' => $entry['icon'] ?? null,
            'count' => (int) $row->count,
            'enchant' => (int) ($row->enchant_level ?? 0),
        ];
    }

    /**
     * Adena first, then weapons, armor and other items, each by name.
     *
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function sortItems(array $items): array
    {
        $typeOrder = ['Weapon' => 0, 'Armor' => 1, 'EtcItem' => 2];

        usort($items, fn (array $a, array $b): int => (($b['itemId'] === 57) <=> ($a['itemId'] === 57))
            ?: (($typeOrder[$a['type']] ?? 3) <=> ($typeOrder[$b['type']] ?? 3))
            ?: strcmp($a['name'], $b['name']));

        return array_values($items);
    }

    private function expPercent(int $level, int $exp): float
    {
        $current = $this->gameData->expForLevel($level) ?? 0;
        $next = $this->gameData->expForLevel($level + 1);

        if ($next === null || $next <= $current) {
            return 100.0;
        }

        return round(max(0, min(100, ($exp - $current) / ($next - $current) * 100)), 2);
    }
}
