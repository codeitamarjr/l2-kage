<?php

namespace App\Filament\Resources\GameActions\Pages;

use App\Filament\Resources\GameActions\GameActionResource;
use App\Models\Game\Character;
use App\Models\GameAction;
use App\Services\L2j\GameData;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Auth;

class CreateGameAction extends CreateRecord
{
    protected static string $resource = GameActionResource::class;

    protected static ?string $title = 'Send Item';

    protected static bool $canCreateAnother = false;

    /**
     * Stores names alongside the IDs so the log stays readable even if a character is later renamed or deleted.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $character = Character::query()->findOrFail($data['character_id']);

        return [
            ...$data,
            'action' => GameAction::ACTION_GIVE_ITEM,
            'character_name' => $character->char_name,
            'item_name' => app(GameData::class)->item((int) $data['item_id'])['name'],
            'enchant' => (int) ($data['enchant'] ?? 0),
            'requested_by' => Auth::user()?->email,
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
