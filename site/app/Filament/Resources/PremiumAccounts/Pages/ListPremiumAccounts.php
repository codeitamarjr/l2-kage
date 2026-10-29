<?php

namespace App\Filament\Resources\PremiumAccounts\Pages;

use App\Filament\Resources\PremiumAccounts\PremiumAccountResource;
use App\Models\Game\Account;
use App\Services\Premium;
use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;

/**
 * The premium list, with whether the system is on (the game config) and "Grant Premium" for any game account.
 */
class ListPremiumAccounts extends ListRecords
{
    protected static string $resource = PremiumAccountResource::class;

    public function getSubheading(): string
    {
        $premium = app(Premium::class);

        return $premium->enabled()
            ? "The premium system is on. Premium gives: {$premium->bonuses()}, for the whole account."
            : 'The premium system is off: set EnablePremiumSystem = True in overrides/game/config/Custom/PremiumSystem.ini and restart the game server. Grants fail until then.';
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('grant')
                ->label('Grant Premium')
                ->icon(Heroicon::OutlinedSparkles)
                ->schema([
                    Select::make('account')
                        ->label('Game account')
                        ->searchable()
                        ->required()
                        ->getSearchResultsUsing(fn (string $search): array => Account::query()
                            ->where('login', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%')
                            ->orderBy('login')
                            ->limit(25)
                            ->pluck('login', 'login')
                            ->all())
                        // Validates and labels the chosen account (it must still exist).
                        ->getOptionLabelUsing(fn (?string $value): ?string => $value !== null ? Account::query()->whereKey($value)->value('login') : null),
                    PremiumAccountResource::daysInput(),
                ])
                ->action(function (array $data): void {
                    app(Premium::class)->grant($data['account'], (int) $data['days'], PremiumAccountResource::requestedBy());
                    PremiumAccountResource::queued("{$data['days']} premium day(s) for {$data['account']}");
                }),
        ];
    }
}
