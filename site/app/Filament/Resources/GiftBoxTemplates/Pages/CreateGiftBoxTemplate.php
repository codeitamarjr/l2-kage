<?php

namespace App\Filament\Resources\GiftBoxTemplates\Pages;

use App\Filament\Resources\GiftBoxTemplates\GiftBoxTemplateResource;
use Filament\Resources\Pages\CreateRecord;

class CreateGiftBoxTemplate extends CreateRecord
{
    protected static string $resource = GiftBoxTemplateResource::class;

    protected static ?string $title = 'Create Gift Box';

    protected static bool $canCreateAnother = false;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
