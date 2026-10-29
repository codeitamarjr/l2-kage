<?php

namespace App\Models\Game;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * An account's premium time (account_premium in the game database, written by the game server's PremiumManager).
 * Read-only here: the admin grants or removes premium through the WebBridge (App\Services\Premium).
 *
 * @property string $account_name
 * @property int $enddate end of premium, Unix time in milliseconds
 */
class PremiumAccount extends Model
{
    protected $connection = 'game';

    protected $table = 'account_premium';

    protected $primaryKey = 'account_name';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    public function endsAt(): Carbon
    {
        return Carbon::createFromTimestampMs((int) $this->enddate);
    }

    public function isActive(): bool
    {
        return $this->endsAt()->isFuture();
    }
}
