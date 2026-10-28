<?php

namespace App\Http\Controllers;

/**
 * Password rules for game accounts: what the Essence client lets players type (up to 16 characters, no spaces).
 */
final class AccountPasswordRules
{
    /**
     * @return list<string>
     */
    public static function rules(): array
    {
        return ['required', 'string', 'min:6', 'max:16', 'regex:/^[\x21-\x7E]+$/', 'confirmed'];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $field = 'password'): array
    {
        return [
            "{$field}.min" => __('Passwords have 6 to 16 characters.'),
            "{$field}.max" => __('Passwords have 6 to 16 characters (the game client accepts no more).'),
            "{$field}.regex" => __('Use letters, digits and symbols, without spaces or accented letters.'),
            "{$field}.confirmed" => __('The two passwords do not match.'),
        ];
    }
}
