<?php

namespace App\Models\Game;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A game account (l2jls.accounts), read through the read-only `login` connection.
 * Players sign in to the website with it (see GameAccountUserProvider); the website never writes it.
 *
 * @property string $login
 * @property string|null $password base64(sha1(password)), the L2J format
 * @property int $accessLevel
 * @property Carbon|null $created_time
 * @property string|null $email
 */
class Account extends Model implements Authenticatable
{
    protected $connection = 'login';

    protected $table = 'accounts';

    protected $primaryKey = 'login';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    /**
     * The only columns the website's database user may read (it can't run SELECT *).
     */
    public const READABLE_COLUMNS = ['login', 'password', 'email', 'accessLevel', 'lastactive', 'created_time'];

    /** @var list<string> */
    protected $hidden = ['password'];

    protected static function booted(): void
    {
        static::addGlobalScope('readable-columns', function (Builder $query): void {
            if ($query->getQuery()->columns === null) {
                $query->select(self::READABLE_COLUMNS);
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'accessLevel' => 'integer',
            'created_time' => 'datetime',
        ];
    }

    /**
     * @return HasMany<Character, $this>
     */
    public function characters(): HasMany
    {
        return $this->hasMany(Character::class, 'account_name', 'login');
    }

    public function isGameMaster(): bool
    {
        return $this->accessLevel > 0;
    }

    public function isBanned(): bool
    {
        return $this->accessLevel < 0;
    }

    public function getAuthIdentifierName(): string
    {
        return 'login';
    }

    public function getAuthIdentifier(): string
    {
        return $this->login;
    }

    public function getAuthPasswordName(): string
    {
        return 'password';
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password;
    }

    /**
     * Game accounts have no remember-me column; sessions only.
     */
    public function getRememberToken(): ?string
    {
        return null;
    }

    public function setRememberToken($value): void {}

    public function getRememberTokenName(): string
    {
        return '';
    }
}
