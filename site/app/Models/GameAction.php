<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A change the website asks the game server to make (see the game_actions migration).
 * Rows are created here and processed by the WebBridge script inside the L2J game server.
 *
 * @property int $id
 * @property string $action
 * @property int $character_id
 * @property string $character_name
 * @property int|null $item_id
 * @property string|null $item_name
 * @property int $count
 * @property int $enchant
 * @property string|null $items "itemId:count:enchant" entries joined by ";" (send_mail)
 * @property string|null $mail_subject
 * @property string|null $mail_text
 * @property string|null $note
 * @property string $status
 * @property string|null $result
 * @property string|null $requested_by
 * @property Carbon|null $processed_at
 */
class GameAction extends Model
{
    public const ACTION_GIVE_ITEM = 'give_item';

    /** One in-game mail with several items attached (the weekly gift box). */
    public const ACTION_SEND_MAIL = 'send_mail';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_DONE = 'done';

    public const STATUS_FAILED = 'failed';

    /** @var list<string> */
    protected $fillable = [
        'action', 'character_id', 'character_name', 'item_id', 'item_name', 'count', 'enchant', 'items', 'mail_subject', 'mail_text',
        'note', 'requested_by',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => self::STATUS_PENDING,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'character_id' => 'integer',
            'item_id' => 'integer',
            'count' => 'integer',
            'enchant' => 'integer',
            'processed_at' => 'datetime',
        ];
    }
}
