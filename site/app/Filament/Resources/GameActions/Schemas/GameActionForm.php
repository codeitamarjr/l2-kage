<?php

namespace App\Filament\Resources\GameActions\Schemas;

use App\Models\Game\Character;
use App\Services\L2j\GameData;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

/**
 * "Send Item": queues a give_item action. The WebBridge script inside the game server delivers it:
 * straight into the inventory when the character is online, by in-game mail when offline.
 */
class GameActionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Send an item to a character')
                    ->description('Delivered by the game server within a few seconds: into the inventory if the character is online, otherwise by in-game mail.')
                    ->columns(2)
                    ->schema([
                        Select::make('character_id')
                            ->label('Character')
                            ->required()
                            ->searchable()
                            ->getSearchResultsUsing(fn (string $search): array => Character::query()
                                ->where('char_name', 'like', '%'.addcslashes($search, '%_').'%')
                                ->orderBy('char_name')
                                ->limit(50)
                                ->get(['charId', 'char_name', 'level', 'account_name'])
                                ->mapWithKeys(fn (Character $c): array => [$c->charId => "{$c->char_name} (Lv {$c->level}, account {$c->account_name})"])
                                ->all())
                            ->getOptionLabelUsing(fn ($value): ?string => Character::query()->find($value)?->char_name),
                        Select::make('item_id')
                            ->label('Item')
                            ->required()
                            ->searchable()
                            ->helperText('Search by name or item ID, e.g. "Adena" or 57.')
                            ->getSearchResultsUsing(fn (string $search): array => app(GameData::class)->searchItems($search))
                            ->getOptionLabelUsing(fn ($value): string => app(GameData::class)->itemLabel((int) $value))
                            ->rule(fn () => function (string $attribute, mixed $value, \Closure $fail): void {
                                if (! app(GameData::class)->itemExists((int) $value)) {
                                    $fail('This item does not exist in the datapack.');
                                }
                            }),
                        TextInput::make('count')
                            ->required()
                            ->integer()
                            ->minValue(1)
                            ->maxValue(2_000_000_000)
                            ->default(1),
                        TextInput::make('enchant')
                            ->label('Enchant level')
                            ->integer()
                            ->minValue(0)
                            ->maxValue(65_535)
                            ->default(0)
                            ->helperText('Weapons and armor only; ignored for other items.'),
                        Textarea::make('note')
                            ->label('Reason (kept in the log)')
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
