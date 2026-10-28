<?php

namespace App\Models\Game;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A character (l2jgs.characters), read-only through the `game` connection.
 *
 * @property int $charId
 * @property string $account_name
 * @property string $char_name
 * @property int $level
 * @property int $classid
 * @property int $base_class
 * @property int $race
 * @property int $sex
 * @property int $online
 * @property int $accesslevel
 * @property int|null $clanid
 */
class Character extends Model
{
    protected $connection = 'game';

    protected $table = 'characters';

    protected $primaryKey = 'charId';

    public $incrementing = false;

    public $timestamps = false;

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_name', 'login');
    }

    /**
     * @return HasMany<Item, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'owner_id', 'charId');
    }
}
