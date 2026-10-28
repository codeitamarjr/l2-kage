<?php

namespace Tests\Feature;

use App\Services\L2j\WorldMap;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class WorldMapTest extends TestCase
{
    /**
     * In-game town coordinates and where the map draws each town, in map pixels.
     *
     * @return array<string, array{int, int, int, int}>
     */
    public static function towns(): array
    {
        return [
            'Giran' => [83400, 147943, 1250, 2040],
            'Aden' => [146331, 25762, 1550, 1418],
            'Schuttgart' => [87386, -143246, 1270, 585],
            'Talking Island' => [-84318, 244579, 400, 2510],
            'Kamael Village' => [-117251, 46771, 232, 1540],
        ];
    }

    #[DataProvider('towns')]
    public function test_towns_land_on_their_map_icons(int $x, int $y, int $px, int $py): void
    {
        $point = WorldMap::project($x, $y);

        $this->assertNotNull($point);
        // Within 1.5% of the map, about 30 px.
        $this->assertEqualsWithDelta($px / WorldMap::WIDTH * 100, $point['x'], 1.5);
        $this->assertEqualsWithDelta($py / WorldMap::HEIGHT * 100, $point['y'], 1.5);
    }

    public function test_unspawned_and_off_map_points_are_not_placed(): void
    {
        $this->assertNull(WorldMap::project(0, 0));
        $this->assertNull(WorldMap::project(-240000, 200000)); // Gracia, west of the map
    }

    public function test_land_mask_separates_land_from_blank_parchment(): void
    {
        $this->assertTrue(WorldMap::onLand(WorldMap::pixel(742, 1900)), 'Town of Gludio');
        $this->assertTrue(WorldMap::onLand(WorldMap::pixel(1305, 1882)), 'Dragon Valley');
        $this->assertFalse(WorldMap::onLand(WorldMap::pixel(300, 900)), 'western sea');
        $this->assertFalse(WorldMap::onLand(WorldMap::pixel(760, 88)), 'northern sea (Pagan Temple spawn)');
    }

    public function test_map_page_renders_even_without_the_game_database(): void
    {
        $this->get('/map')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('map')->where('events', null)->where('map', null));
    }
}
