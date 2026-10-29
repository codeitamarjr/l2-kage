<?php

namespace App\Rules;

use App\Models\GiftBoxTemplate;
use App\Services\L2j\GameData;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A gift box entry's item: an item id that exists on this server, or a grade key from config l2j.gift_box.grades
 * ("enchant_weapon", ...), which becomes the scroll for the receiving character's grade.
 */
class GiftBoxItem implements ValidationRule
{
    /**
     * @return list<string>
     */
    public static function gradeKeys(): array
    {
        $grades = config('l2j.gift_box.grades');

        return array_values(array_diff(array_keys((array) reset($grades)), ['from']));
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $item = GiftBoxTemplate::itemKey((string) $value);

        if (is_int($item) ? ! app(GameData::class)->itemExists($item) : ! in_array($item, self::gradeKeys(), true)) {
            $fail('Use an item id that exists on this server, or one of: '.implode(', ', self::gradeKeys()).'.');
        }
    }
}
