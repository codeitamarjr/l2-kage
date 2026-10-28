<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A one-time link emailed to a player (see App\Services\GameAccounts and the account_tokens migration).
 *
 * @property int $id
 * @property string $type
 * @property string $login
 * @property string|null $email
 * @property string|null $password_hash
 * @property string $token_hash
 * @property Carbon $expires_at
 */
class AccountToken extends Model
{
    public const REGISTER = 'register';

    public const RESET = 'reset';

    public const EMAIL = 'email';

    /** @var list<string> */
    protected $fillable = ['type', 'login', 'email', 'password_hash', 'token_hash', 'expires_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeValid(Builder $query): void
    {
        $query->where('expires_at', '>', now());
    }
}
