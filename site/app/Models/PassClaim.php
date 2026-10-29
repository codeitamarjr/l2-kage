<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A Kage Pass claimed by a game account for a season (see App\Services\KagePass).
 *
 * @property int $id
 * @property string $account
 * @property string $season
 * @property int $character_id
 * @property string $character_name
 * @property int|null $game_action_id
 * @property Carbon $created_at
 */
class PassClaim extends Model
{
    /** @var list<string> */
    protected $fillable = ['account', 'season', 'character_id', 'character_name', 'game_action_id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['character_id' => 'integer'];
    }

    /**
     * The in-game action that takes the L-Coin and mails the rewards.
     *
     * @return BelongsTo<GameAction, $this>
     */
    public function gameAction(): BelongsTo
    {
        return $this->belongsTo(GameAction::class);
    }
}
