<?php

namespace App\Filament\Resources\GameActions\Tables;

use App\Models\GameAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

/**
 * The delivery log. Rows are never edited or deleted from the admin: it is the audit trail of what the
 * website asked the game server to do and what the game server answered.
 */
class GameActionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('id', 'desc')
            ->poll('5s')
            ->columns([
                TextColumn::make('id')->label('#')->sortable(),
                TextColumn::make('created_at')->label('Requested')->since()->sortable(),
                TextColumn::make('character_name')->label('Character')->searchable(),
                TextColumn::make('item_name')
                    ->label('Item')
                    ->formatStateUsing(fn (GameAction $record): string => ($record->enchant ? "+{$record->enchant} " : '').$record->item_name)
                    // A gift box mail carries several items: list them under its name.
                    ->description(fn (GameAction $record): string => $record->action === GameAction::ACTION_SEND_MAIL ? (string) $record->note : "ID {$record->item_id}")
                    ->wrap()
                    ->searchable(),
                TextColumn::make('count')->numeric(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        GameAction::STATUS_DONE => 'success',
                        GameAction::STATUS_FAILED => 'danger',
                        GameAction::STATUS_PROCESSING => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('result')->wrap()->placeholder('Waiting for the game server…'),
                TextColumn::make('requested_by')->label('By')->toggleable(),
                TextColumn::make('note')->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('processed_at')->label('Processed')->since()->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    GameAction::STATUS_PENDING => 'Pending',
                    GameAction::STATUS_PROCESSING => 'Processing',
                    GameAction::STATUS_DONE => 'Done',
                    GameAction::STATUS_FAILED => 'Failed',
                ]),
            ]);
    }
}
