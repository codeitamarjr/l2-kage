<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Cloudflare Turnstile bot check. Passes when Turnstile isn't configured (local development).
 */
class Turnstile implements ValidationRule
{
    public function __construct(private ?string $ip = null) {}

    public static function enabled(): bool
    {
        return filled(config('services.turnstile.secret_key')) && filled(config('services.turnstile.site_key'));
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::enabled()) {
            return;
        }

        try {
            $passed = is_string($value) && $value !== '' && Http::asForm()->timeout(10)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => config('services.turnstile.secret_key'),
                    'response' => $value,
                    'remoteip' => $this->ip,
                ])->json('success') === true;
        } catch (Throwable) {
            $passed = false;
        }

        if (! $passed) {
            $fail(__('Please complete the check that you are not a bot, then try again.'));
        }
    }
}
