<?php

namespace Tests\Feature;

use App\Services\L2j\EventFeed;
use Illuminate\Support\Facades\File;
use ReflectionMethod;
use Tests\TestCase;

class SeasonalEventOverrideTest extends TestCase
{
    public function test_an_event_config_in_overrides_replaces_the_datapack_one(): void
    {
        $root = sys_get_temp_dir().'/events-'.uniqid();
        $config = fn (string $active): string => '<event name="Squash" active="'.$active.'"></event>';

        File::ensureDirectoryExists("{$root}/defaults/SquashEvent");
        File::ensureDirectoryExists("{$root}/overrides/SquashEvent");
        File::put("{$root}/defaults/SquashEvent/config.xml", $config('09 03 2017-10 03 2017'));
        File::put("{$root}/overrides/SquashEvent/config.xml", $config(now()->subDay()->format('d m Y').'-'.now()->addDay()->format('d m Y')));

        config(['l2j.events_dir' => "{$root}/defaults", 'l2j.events_overrides_dir' => "{$root}/overrides"]);

        $events = (new ReflectionMethod(EventFeed::class, 'seasonal'))->invoke(app(EventFeed::class), (int) round(microtime(true) * 1000));

        $this->assertContains('event-SquashEvent', array_column($events, 'id'));

        File::deleteDirectory($root);
    }
}
