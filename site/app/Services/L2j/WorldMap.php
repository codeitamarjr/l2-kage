<?php

namespace App\Services\L2j;

use Illuminate\Support\Facades\Cache;

/**
 * Places game-world coordinates on the world map of Aden (public/assets/map/aden-world-map.webp, 1977 x 2620 px).
 *
 * The map is drawn to scale: 1 px is about 200 game units, north up. The transform below is a least-squares fit
 * of 18 towns' in-game coordinates against where the map draws them (residuals under 20 px, about 1% of the map).
 * Points are returned as percentages of the image so the front end can scale the map freely.
 */
class WorldMap
{
    public const WIDTH = 1977;

    public const HEIGHT = 2620;

    /** px = A * x + B * y + C, py = D * x + E * y + F */
    private const A = 0.005041621944;

    private const B = -0.0000136004214;

    private const C = 819.938482968;

    private const D = -0.0000327780084;

    private const E = 0.00502486878;

    private const F = 1295.94199139;

    /** Size of a land mask cell, in map pixels (see resources/data/map/build-map.sh). */
    private const MASK_CELL = 20;

    /** @var list<string>|null Rows of the land mask, "1" = land. */
    private static ?array $mask = null;

    public function __construct(private GameData $gameData, private EventFeed $events) {}

    /**
     * A point from game coordinates, or null when it falls outside the map (Gracia, instance zones, unspawned).
     *
     * @return array{x: float, y: float}|null
     */
    public static function project(int $x, int $y): ?array
    {
        if ($x === 0 && $y === 0) {
            return null;
        }

        $px = self::A * $x + self::B * $y + self::C;
        $py = self::D * $x + self::E * $y + self::F;

        return $px < 0 || $py < 0 || $px > self::WIDTH || $py > self::HEIGHT ? null : self::pixel($px, $py);
    }

    /**
     * A point from a position on the map image, in pixels.
     *
     * @return array{x: float, y: float}
     */
    public static function pixel(float $px, float $py): array
    {
        return ['x' => round($px / self::WIDTH * 100, 2), 'y' => round($py / self::HEIGHT * 100, 2)];
    }

    /**
     * Whether a point is drawn on land. Spawns that project onto the blank parchment are instance zones and
     * hidden areas (the Pagan Temple, Hellbound's interior...) that the map doesn't show. Cells next to land count
     * as land, so coastal spawns stay.
     *
     * @param  array{x: float, y: float}  $point
     */
    public static function onLand(array $point): bool
    {
        self::$mask ??= self::loadMask();

        if (self::$mask === []) {
            return true; // no mask: show everything rather than nothing
        }

        $column = (int) ($point['x'] / 100 * self::WIDTH / self::MASK_CELL);
        $row = (int) ($point['y'] / 100 * self::HEIGHT / self::MASK_CELL);

        for ($r = $row - 1; $r <= $row + 1; $r++) {
            for ($c = $column - 1; $c <= $column + 1; $c++) {
                if ((self::$mask[$r][$c] ?? '0') === '1') {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    private static function loadMask(): array
    {
        $values = preg_split('/\s+/', trim((string) @file_get_contents(resource_path('data/map/aden-world-map-land.pbm'))));

        if (($values[0] ?? '') !== 'P1') {
            return [];
        }

        [$width, $height] = [(int) $values[1], (int) $values[2]];

        return array_map(fn (int $row): string => implode('', array_slice($values, 3 + $row * $width, $width)), range(0, $height - 1));
    }

    /**
     * Every raid boss on the map with its state. Bosses beyond the map (Gracia, instance zones, Hellbound's
     * interior...) are only counted.
     *
     * @return array{raids: list<array{id: int, name: string, level: int|null, x: float, y: float, alive: bool, returnsAt: string|null}>, beyond: int}
     */
    public function get(): array
    {
        return Cache::remember('l2j.map', config('l2j.cache_seconds'), fn (): array => $this->build((int) round(microtime(true) * 1000)));
    }

    /**
     * @return array{raids: list<array{id: int, name: string, level: int|null, x: float, y: float, alive: bool, returnsAt: string|null}>, beyond: int}
     */
    public function build(int $now): array
    {
        $rows = $this->events->raidSpawns();
        $raids = [];
        $beyond = 0;

        foreach ($rows as $row) {
            $point = self::project((int) $row->loc_x, (int) $row->loc_y);

            if ($point === null || ! self::onLand($point)) {
                $beyond++;

                continue;
            }

            $boss = $this->gameData->boss((int) $row->boss_id);
            $alive = (int) $row->respawn_time <= $now;
            $raids[] = [
                'id' => (int) $row->boss_id,
                'name' => $boss['name'],
                'level' => $boss['level'],
                ...$point,
                'alive' => $alive,
                'returnsAt' => $alive ? null : EventFeed::iso((int) $row->respawn_time),
            ];
        }

        usort($raids, fn (array $a, array $b): int => ($a['level'] ?? 0) <=> ($b['level'] ?? 0));

        return ['raids' => $raids, 'beyond' => $beyond];
    }
}
