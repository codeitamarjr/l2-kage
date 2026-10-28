<?php

namespace App\Models\Game;

use Illuminate\Database\Eloquent\Model;

/**
 * An item instance (l2jgs.items), read-only through the `game` connection.
 *
 * @property int $object_id
 * @property int $owner_id
 * @property int $item_id
 * @property int $count
 * @property int|null $enchant_level
 * @property string $loc PAPERDOLL, INVENTORY, WAREHOUSE, ...
 * @property int|null $loc_data
 */
class Item extends Model
{
    protected $connection = 'game';

    protected $table = 'items';

    protected $primaryKey = 'object_id';

    public $incrementing = false;

    public $timestamps = false;
}
