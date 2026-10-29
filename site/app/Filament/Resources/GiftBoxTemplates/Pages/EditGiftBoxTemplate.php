<?php

namespace App\Filament\Resources\GiftBoxTemplates\Pages;

use App\Filament\Resources\GiftBoxTemplates\GiftBoxTemplateResource;
use Filament\Resources\Pages\EditRecord;

class EditGiftBoxTemplate extends EditRecord
{
    protected static string $resource = GiftBoxTemplateResource::class;

    protected static ?string $title = 'Edit Gift Box';

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
