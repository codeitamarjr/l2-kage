<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A weekly gift box claimed by a game account (see App\Services\GiftBox).
 *
 * @property int $id
 * @property string $account
 * @property Carbon $week_start
 * @property int $character_id
 * @property string $character_name
 * @property list<array{id: int, name: string, count: int, bonus: bool}> $items
 * @property int|null $game_action_id
 * @property Carbon $created_at
 */
class GiftClaim extends Model
{
    /** @var list<string> */
    protected $fillable = ['account', 'week_start', 'character_id', 'character_name', 'items', 'game_action_id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'character_id' => 'integer',
            'items' => 'array',
        ];
    }

    /**
     * The in-game mail that delivers the box.
     *
     * @return BelongsTo<GameAction, $this>
     */
    public function gameAction(): BelongsTo
    {
        return $this->belongsTo(GameAction::class);
    }
}
