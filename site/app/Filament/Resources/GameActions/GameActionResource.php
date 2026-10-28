<?php

namespace App\Filament\Resources\GameActions;

use App\Filament\Resources\GameActions\Pages\CreateGameAction;
use App\Filament\Resources\GameActions\Pages\ListGameActions;
use App\Filament\Resources\GameActions\Schemas\GameActionForm;
use App\Filament\Resources\GameActions\Tables\GameActionsTable;
use App\Models\GameAction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class GameActionResource extends Resource
{
    protected static ?string $model = GameAction::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGift;

    protected static ?string $navigationLabel = 'Item Deliveries';

    protected static ?string $modelLabel = 'item delivery';

    protected static ?string $pluralModelLabel = 'item deliveries';

    public static function form(Schema $schema): Schema
    {
        return GameActionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return GameActionsTable::configure($table);
    }

    /**
     * The log is an audit trail: no editing or deleting.
     */
    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListGameActions::route('/'),
            'create' => CreateGameAction::route('/create'),
        ];
    }
}
