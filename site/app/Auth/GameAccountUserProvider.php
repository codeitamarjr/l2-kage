<?php

namespace App\Auth;

use App\Models\Game\Account;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;

/**
 * Lets players sign in to the website with their game account (l2jls.accounts), read-only.
 * Passwords are checked the way L2J stores them: base64(sha1(password)).
 */
class GameAccountUserProvider implements UserProvider
{
    public function retrieveById($identifier): ?Authenticatable
    {
        return Account::query()->find($identifier);
    }

    public function retrieveByToken($identifier, #[\SensitiveParameter] $token): ?Authenticatable
    {
        return null;
    }

    public function updateRememberToken(Authenticatable $user, #[\SensitiveParameter] $token): void {}

    /**
     * @param  array<string, mixed>  $credentials
     */
    public function retrieveByCredentials(#[\SensitiveParameter] array $credentials): ?Authenticatable
    {
        $login = $credentials['login'] ?? null;

        if (! is_string($login) || $login === '') {
            return null;
        }

        return Account::query()->where('login', $login)->first();
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    public function validateCredentials(Authenticatable $user, #[\SensitiveParameter] array $credentials): bool
    {
        $password = $credentials['password'] ?? null;

        if (! is_string($password) || $password === '') {
            return false;
        }

        return hash_equals($user->getAuthPassword(), self::hash($password));
    }

    /**
     * L2J manages the password; the website never rewrites it.
     *
     * @param  array<string, mixed>  $credentials
     */
    public function rehashPasswordIfRequired(Authenticatable $user, #[\SensitiveParameter] array $credentials, bool $force = false): void {}

    /**
     * The L2J password format.
     */
    public static function hash(#[\SensitiveParameter] string $password): string
    {
        return base64_encode(sha1($password, true));
    }
}
