<?php

namespace App\Filament\Resources\GameActions\Pages;

use App\Filament\Resources\GameActions\GameActionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGameActions extends ListRecords
{
    protected static string $resource = GameActionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Send Item'),
        ];
    }
}
