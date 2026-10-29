<?php

namespace App\Filament\Resources\PremiumAccounts;

use App\Filament\Resources\PremiumAccounts\Pages\ListPremiumAccounts;
use App\Models\Game\PremiumAccount;
use App\Services\Premium;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Premium accounts: who has premium and until when (account_premium, read-only), with actions to add days or remove
 * it. Changes go to the game server through the WebBridge (App\Services\Premium) and show in Item Deliveries.
 */
class PremiumAccountResource extends Resource
{
    protected static ?string $model = PremiumAccount::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    protected static ?string $navigationLabel = 'Premium Accounts';

    protected static ?string $modelLabel = 'premium account';

    protected static ?string $pluralModelLabel = 'premium accounts';

    protected static ?string $recordTitleAttribute = 'account_name';

    public static function table(Table $table): Table
    {
        $now = now()->getTimestampMs();

        return $table
            ->defaultSort('enddate', 'desc')
            ->poll('10s')
            ->columns([
                TextColumn::make('account_name')->label('Account')->searchable()->sortable(),
                TextColumn::make('enddate')
                    ->label('Premium until')
                    ->formatStateUsing(fn (PremiumAccount $record): string => $record->endsAt()->format('j M Y, H:i'))
                    ->description(fn (PremiumAccount $record): string => $record->isActive() ? $record->endsAt()->diffForHumans(syntax: true).' left' : 'ended '.$record->endsAt()->diffForHumans())
                    ->sortable(),
                TextColumn::make('status')
                    ->state(fn (PremiumAccount $record): string => $record->isActive() ? 'Active' : 'Ended')
                    ->badge()
                    ->color(fn (string $state): string => $state === 'Active' ? 'success' : 'gray'),
            ])
            ->filters([
                TernaryFilter::make('active')
                    ->label('Status')
                    ->trueLabel('Active')
                    ->falseLabel('Ended')
                    ->queries(
                        true: fn (Builder $query) => $query->where('enddate', '>', $now),
                        false: fn (Builder $query) => $query->where('enddate', '<=', $now),
                    ),
            ])
            ->recordActions([
                Action::make('addDays')
                    ->label('Add days')
                    ->icon(Heroicon::OutlinedPlus)
                    ->schema([self::daysInput()])
                    ->action(function (PremiumAccount $record, array $data): void {
                        app(Premium::class)->grant($record->account_name, (int) $data['days'], self::requestedBy());
                        self::queued("{$data['days']} premium day(s) for {$record->account_name}");
                    }),
                Action::make('remove')
                    ->label('Remove')
                    ->icon(Heroicon::OutlinedXMark)
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalDescription('The account loses its premium bonuses at once if it is online, or at its next login.')
                    ->action(function (PremiumAccount $record): void {
                        app(Premium::class)->remove($record->account_name, self::requestedBy());
                        self::queued("Removing premium from {$record->account_name}");
                    }),
            ])
            ->emptyStateHeading('No premium accounts yet')
            ->emptyStateDescription('Use "Grant Premium" to give an account premium time.');
    }

    public static function daysInput(): TextInput
    {
        return TextInput::make('days')->label('Days')->integer()->minValue(1)->maxValue(3650)->default(30)->required();
    }

    public static function requestedBy(): string
    {
        return 'admin ('.(Auth::user()?->email ?? 'unknown').')';
    }

    public static function queued(string $what): void
    {
        Notification::make()
            ->title("{$what}: sent to the game server")
            ->body('It is applied within a few seconds; the result shows in Item Deliveries.')
            ->success()
            ->send();
    }

    /** Read-only: premium is changed through the actions, never by editing rows. */
    public static function canCreate(): bool
    {
        return false;
    }

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
            'index' => ListPremiumAccounts::route('/'),
        ];
    }
}
