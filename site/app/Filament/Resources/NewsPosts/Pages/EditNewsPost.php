<?php

namespace App\Filament\Resources\NewsPosts\Pages;

use App\Filament\Resources\NewsPosts\NewsPostResource;
use Filament\Resources\Pages\EditRecord;

class EditNewsPost extends EditRecord
{
    protected static string $resource = NewsPostResource::class;

    protected static ?string $title = 'Edit Post';

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
