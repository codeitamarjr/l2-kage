<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads the item database (resources/data/itemdb.ndjson.gz, built by resources/data/build-itemdb.mjs) into the
 * itemdb_* tables. Runs on every container start and skips the work when the file hasn't changed.
 */
#[Signature('itemdb:import {--file= : Path to the .ndjson.gz export} {--force : Import even if the file is unchanged}')]
#[Description('Import the item database (items, drops, merchants, recipes) from the datapack export')]
class ImportItemDatabase extends Command
{
    private const BATCH = 1000;

    /** Record type => [table, row builder]. */
    private const TABLES = ['item' => 'itemdb_items', 'npc' => 'itemdb_npcs', 'drop' => 'itemdb_drops', 'shop' => 'itemdb_shop_items', 'recipe' => 'itemdb_recipes'];

    public function handle(): int
    {
        $file = $this->option('file') ?: resource_path('data/itemdb.ndjson.gz');

        if (! is_readable($file)) {
            $this->warn("Item database export not found: {$file}");

            return self::SUCCESS;
        }

        $hash = hash_file('sha256', $file);

        if (! $this->option('force') && DB::table('itemdb_meta')->where('key', 'hash')->value('value') === $hash) {
            $this->info('Item database is up to date.');

            return self::SUCCESS;
        }

        $counts = DB::transaction(function () use ($file, $hash): array {
            foreach ([...array_values(self::TABLES), 'itemdb_recipe_ingredients'] as $table) {
                DB::table($table)->delete();
            }

            $batches = [];
            $counts = [];
            $handle = gzopen($file, 'rb') ?: throw new RuntimeException("Cannot open {$file}");

            while (($line = gzgets($handle)) !== false) {
                if (trim($line) === '') {
                    continue;
                }

                $record = json_decode($line, true, flags: JSON_THROW_ON_ERROR);

                foreach ($this->rows($record) as $table => $row) {
                    $batches[$table][] = $row;
                    $counts[$table] = ($counts[$table] ?? 0) + 1;

                    if (count($batches[$table]) >= self::BATCH) {
                        DB::table($table)->insert($batches[$table]);
                        $batches[$table] = [];
                    }
                }
            }

            gzclose($handle);

            foreach ($batches as $table => $rows) {
                if ($rows) {
                    DB::table($table)->insert($rows);
                }
            }

            DB::table('itemdb_meta')->upsert([['key' => 'hash', 'value' => $hash], ['key' => 'imported_at', 'value' => now()->toIso8601String()]], ['key'], ['value']);

            return $counts;
        });

        $this->info('Item database imported: '.collect($counts)->map(fn (int $n, string $table): string => number_format($n).' '.str_replace('itemdb_', '', $table))->implode(', ').'.');

        return self::SUCCESS;
    }

    /**
     * The table rows for one export record.
     *
     * @param  array<string, mixed>  $r
     * @return iterable<string, array<string, mixed>>
     */
    private function rows(array $r): iterable
    {
        switch ($r['t']) {
            case 'item':
                yield 'itemdb_items' => [
                    'id' => $r['id'], 'name' => $r['name'], 'type' => $r['type'], 'kind' => $r['kind'], 'category' => $r['category'],
                    'grade' => $r['grade'], 'icon' => $r['icon'], 'weight' => $r['weight'], 'price' => $r['price'], 'crystals' => $r['crystals'],
                    'details' => json_encode(['ss' => $r['ss'], 'sps' => $r['sps'], 'mp' => $r['mp'], 'flags' => $r['flags'], 'stats' => (object) $r['stats']]),
                ];
                break;
            case 'npc':
                yield 'itemdb_npcs' => ['id' => $r['id'], 'name' => $r['name'], 'title' => $r['title'], 'level' => $r['level'], 'type' => $r['type']];
                break;
            case 'drop':
                yield 'itemdb_drops' => [
                    'group_id' => $r['g'], 'npc_id' => $r['npc'], 'item_id' => $r['item'], 'kind' => $r['kind'],
                    'min' => $r['min'], 'max' => $r['max'], 'chance' => $r['chance'], 'group_chance' => $r['gchance'],
                ];
                break;
            case 'shop':
                yield 'itemdb_shop_items' => ['npc_id' => $r['npc'], 'item_id' => $r['item']];
                break;
            case 'recipe':
                yield 'itemdb_recipes' => [
                    'id' => $r['id'], 'recipe_item_id' => $r['recipe'], 'name' => $r['name'], 'level' => $r['level'], 'dwarven' => $r['dwarven'],
                    'success_rate' => $r['success'], 'mp_cost' => $r['mp'], 'product_id' => $r['product'], 'product_count' => $r['count'],
                    'rare' => $r['rare'] ? json_encode($r['rare']) : null, 'ingredients' => json_encode($r['ingredients']),
                ];
                foreach ($r['ingredients'] as [$itemId, $count]) {
                    yield 'itemdb_recipe_ingredients' => ['recipe_id' => $r['id'], 'item_id' => $itemId, 'count' => $count];
                }
                break;
        }
    }
}
