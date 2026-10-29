<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A weekly gift box edited in the admin panel (Gift Boxes). The active one replaces the gift box contents from
 * config/l2j.php (see App\Services\GiftBox); with none active, the config is used.
 *
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property list<array{item: int|string, count: int|string}> $guaranteed
 * @property list<array{item: int|string, count: int|string, weight: int|string}> $bonus
 */
class GiftBoxTemplate extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = ['name', 'description', 'is_active', 'starts_at', 'ends_at', 'guaranteed', 'bonus'];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'guaranteed' => 'array',
            'bonus' => 'array',
        ];
    }

    /**
     * @param  Builder<GiftBoxTemplate>  $query
     * @return Builder<GiftBoxTemplate>
     */
    public function scopeActiveAt(Builder $query, CarbonImmutable $date): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $date))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $date))
            ->orderBy('starts_at');
    }

    /**
     * The contents in the shape GiftBox uses (like config l2j.gift_box): the admin form saves every field as text, so
     * item ids, counts and weights become numbers again, and grade keys ("enchant_weapon") stay strings.
     *
     * @return array{guaranteed: list<array{item: int|string, count: int}>, bonus: list<array{item: int|string, count: int, weight: int}>, name: string, description: string|null}
     */
    public function data(): array
    {
        return [
            'guaranteed' => array_map(fn (array $entry): array => [
                'item' => self::itemKey($entry['item']),
                'count' => (int) $entry['count'],
            ], array_values($this->guaranteed ?? [])),
            'bonus' => array_map(fn (array $entry): array => [
                'item' => self::itemKey($entry['item']),
                'count' => (int) $entry['count'],
                'weight' => (int) $entry['weight'],
            ], array_values($this->bonus ?? [])),
            'name' => $this->name,
            'description' => $this->description,
        ];
    }

    /**
     * An item id as a number ("57" -> 57), or a grade key as it is ("enchant_weapon").
     */
    public static function itemKey(int|string $item): int|string
    {
        $item = trim((string) $item);

        return ctype_digit($item) ? (int) $item : $item;
    }
}
