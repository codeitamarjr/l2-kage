<?php

namespace App\Filament\Resources\GiftBoxTemplates\Pages;

use App\Filament\Resources\GiftBoxTemplates\GiftBoxTemplateResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGiftBoxTemplates extends ListRecords
{
    protected static string $resource = GiftBoxTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('New Gift Box'),
        ];
    }
}
