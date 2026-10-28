<?php

namespace App\Services;

use App\Auth\GameAccountUserProvider;
use App\Mail\AccountMail;
use App\Models\AccountToken;
use App\Models\Game\Account;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Game accounts managed from the website: registration (the account is created in l2jls.accounts only once the
 * email is confirmed), password reset by email, and password / email changes in the player area.
 *
 * The login server reads the password from the database on every login, so a new password works in game at once.
 * Emails never say whether an account or address exists (forgot-password always answers the same).
 */
class GameAccounts
{
    /**
     * Can the site send email? Without it, registration and password resets are closed (their emails would never
     * arrive). Always ready in local development and tests, where mail goes to the log.
     */
    public static function emailReady(): bool
    {
        if (app()->environment('local', 'testing')) {
            return true;
        }

        $mailer = (string) config('mail.default');

        // SMTP (Amazon SES, Resend...) only counts once its credentials are filled in.
        return match ($mailer) {
            'log', 'array' => false,
            'smtp' => filled(config('mail.mailers.smtp.username')) && filled(config('mail.mailers.smtp.password')),
            default => true,
        };
    }

    /**
     * Is the name in use, by an account or by a registration still waiting for its email confirmation?
     */
    public function isNameTaken(string $login): bool
    {
        return $this->accounts()->where('login', $login)->exists()
            || AccountToken::valid()->where('type', AccountToken::REGISTER)->where('login', $login)->exists();
    }

    /**
     * Starts a registration: keeps the details for 24 hours and emails a link that creates the account.
     *
     * @throws ValidationException when the name is taken or the email has too many accounts
     */
    public function register(string $login, string $email, #[\SensitiveParameter] string $password): void
    {
        $login = Str::lower($login);
        AccountToken::where('expires_at', '<=', now())->delete();

        if ($this->isNameTaken($login)) {
            throw ValidationException::withMessages(['login' => __('That account name is taken. Try another one.')]);
        }

        $this->ensureEmailHasRoom($email, 'email');

        $token = $this->issue(AccountToken::REGISTER, $login, $email, now()->addHours((int) config('l2j.accounts.register_link_hours')), [
            'password_hash' => GameAccountUserProvider::hash($password),
        ]);

        Mail::to($email)->send(new AccountMail(
            title: __('Confirm your account'),
            lines: [
                __('Welcome to Aden! You asked to create the game account ":login".', ['login' => $login]),
                __('Confirm your email to create it. Then log in to the game with this account name and your password.'),
            ],
            actions: [['label' => __('Create my account'), 'url' => route('register.confirm', $token)]],
            footer: [__('The link works once and expires in 24 hours. If you did not ask for this, ignore this email: no account is created.')],
        ));
    }

    /**
     * Creates the game account from a confirmed registration. Null when the link is unknown, expired or used.
     *
     * @throws ValidationException when someone else took the name in the meantime
     */
    public function confirmRegistration(string $token): ?Account
    {
        $pending = $this->find(AccountToken::REGISTER, $token);

        if ($pending === null) {
            return null;
        }

        $pending->delete();

        if ($this->accounts()->where('login', $pending->login)->exists()) {
            throw ValidationException::withMessages(['login' => __('That account name was taken before you confirmed. Please register again with another name.')]);
        }

        $this->accounts()->insert([
            'login' => $pending->login,
            'password' => $pending->password_hash,
            'email' => $pending->email,
            'accessLevel' => 0,
        ]);

        return Account::find($pending->login);
    }

    /**
     * Emails a reset link for every account registered with this address. Does nothing (and says nothing) when
     * there is none.
     */
    public function sendPasswordReset(string $email): void
    {
        $logins = $this->accounts()->where('email', $email)->where('accessLevel', '>=', 0)->orderBy('login')->pluck('login');

        if ($logins->isEmpty()) {
            return;
        }

        $expires = now()->addMinutes((int) config('l2j.accounts.reset_link_minutes'));
        $actions = $logins->map(fn (string $login): array => [
            'label' => __('Reset password for :login', ['login' => $login]),
            'url' => route('password.reset', $this->issue(AccountToken::RESET, $login, $email, $expires)),
        ])->all();

        Mail::to($email)->send(new AccountMail(
            title: __('Reset your password'),
            lines: [
                $logins->count() > 1
                    ? __('Someone (hopefully you) asked to reset the password of your game accounts on :server.', ['server' => config('l2j.server_name')])
                    : __('Someone (hopefully you) asked to reset the password of your game account on :server.', ['server' => config('l2j.server_name')]),
                $logins->count() > 1 ? __('Choose the account to reset:') : __('Choose a new password here:'),
            ],
            actions: $actions,
            footer: [__('Each link works once and expires in :minutes minutes. If you did not ask for this, ignore this email: your password stays the same.', ['minutes' => config('l2j.accounts.reset_link_minutes')])],
        ));
    }

    /**
     * The account a reset link is for, or null when it's unknown, expired or used.
     */
    public function resetLogin(string $token): ?string
    {
        return $this->find(AccountToken::RESET, $token)?->login;
    }

    /**
     * Sets a new password from a reset link. Returns the account name, or null when the link is no longer valid.
     */
    public function resetPassword(string $token, #[\SensitiveParameter] string $password): ?string
    {
        $reset = $this->find(AccountToken::RESET, $token);

        if ($reset === null) {
            return null;
        }

        $this->setPassword($reset->login, $password);
        AccountToken::where('type', AccountToken::RESET)->where('login', $reset->login)->delete();

        return $reset->login;
    }

    /**
     * @throws ValidationException when the current password is wrong
     */
    public function changePassword(Account $account, #[\SensitiveParameter] string $current, #[\SensitiveParameter] string $new): void
    {
        $this->checkPassword($account, $current);
        $this->setPassword($account->login, $new);
    }

    /**
     * Emails a confirmation link to the new address; the email changes only once it's clicked.
     *
     * @throws ValidationException when the current password is wrong or the address has too many accounts
     */
    public function requestEmailChange(Account $account, string $email, #[\SensitiveParameter] string $currentPassword): void
    {
        $this->checkPassword($account, $currentPassword, 'email_password');
        $this->ensureEmailHasRoom($email, 'email');

        $token = $this->issue(AccountToken::EMAIL, $account->login, $email, now()->addHours((int) config('l2j.accounts.register_link_hours')));

        Mail::to($email)->send(new AccountMail(
            title: __('Confirm your email'),
            lines: [__('Confirm this address for the game account ":login". It\'s where password reset links will be sent.', ['login' => $account->login])],
            actions: [['label' => __('Confirm my email'), 'url' => route('account.email.confirm', $token)]],
            footer: [__('The link works once and expires in 24 hours. If you did not ask for this, ignore this email.')],
        ));
    }

    /**
     * Saves a confirmed email. Returns the account name, or null when the link is no longer valid.
     */
    public function confirmEmail(string $token): ?string
    {
        $change = $this->find(AccountToken::EMAIL, $token);

        if ($change === null) {
            return null;
        }

        $change->delete();
        $this->accounts()->where('login', $change->login)->update(['email' => $change->email]);

        return $change->login;
    }

    private function accounts(): Builder
    {
        return DB::connection('login')->table('accounts');
    }

    private function setPassword(string $login, #[\SensitiveParameter] string $password): void
    {
        $this->accounts()->where('login', $login)->update(['password' => GameAccountUserProvider::hash($password)]);
    }

    private function checkPassword(Account $account, #[\SensitiveParameter] string $password, string $field = 'current_password'): void
    {
        if (! hash_equals($account->getAuthPassword(), GameAccountUserProvider::hash($password))) {
            throw ValidationException::withMessages([$field => __('Your current password is not correct.')]);
        }
    }

    private function ensureEmailHasRoom(string $email, string $field): void
    {
        $max = (int) config('l2j.accounts.max_per_email');
        $used = $this->accounts()->where('email', $email)->count()
            + AccountToken::valid()->where('type', AccountToken::REGISTER)->where('email', $email)->count();

        if ($used >= $max) {
            throw ValidationException::withMessages([$field => __('This email already has :max game accounts, the most allowed.', ['max' => $max])]);
        }
    }

    /**
     * Stores a new one-time link and returns its token (only its hash is kept).
     *
     * @param  array<string, mixed>  $extra
     */
    private function issue(string $type, string $login, string $email, \DateTimeInterface $expires, array $extra = []): string
    {
        $token = Str::random(64);

        AccountToken::create([
            'type' => $type,
            'login' => $login,
            'email' => $email,
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expires,
            ...$extra,
        ]);

        return $token;
    }

    private function find(string $type, string $token): ?AccountToken
    {
        return AccountToken::valid()->where('type', $type)->where('token_hash', hash('sha256', $token))->first();
    }
}
