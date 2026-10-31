<?php

namespace App\Filament\Resources\NewsPosts;

use App\Filament\Resources\NewsPosts\Pages\CreateNewsPost;
use App\Filament\Resources\NewsPosts\Pages\EditNewsPost;
use App\Filament\Resources\NewsPosts\Pages\ListNewsPosts;
use App\Models\NewsPost;
use BackedEnum;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Str;

/**
 * Posts for the home page's News from Aden section, /news and the home page banner.
 */
class NewsPostResource extends Resource
{
    protected static ?string $model = NewsPost::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedNewspaper;

    protected static ?string $navigationLabel = 'News';

    protected static ?string $modelLabel = 'news post';

    protected static ?string $pluralModelLabel = 'news posts';

    protected static ?string $recordTitleAttribute = 'title_en';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Post')
                ->columns(2)
                ->schema([
                    Select::make('category')
                        ->options(NewsPost::CATEGORIES)
                        ->default('announcement')
                        ->required()
                        ->native(false),
                    DateTimePicker::make('published_at')
                        ->label('Publish at')
                        ->helperText('Times are in UTC. Leave empty to keep it as a draft. A future date publishes it then.')
                        ->native(false),
                    TextInput::make('slug')
                        ->label('Web address')
                        ->prefix('/news/')
                        ->required()
                        ->alphaDash()
                        ->unique(ignoreRecord: true)
                        ->maxLength(120)
                        ->helperText('Filled in from the English title.')
                        ->columnSpanFull(),
                    FileUpload::make('image')
                        ->image()
                        ->disk('public')
                        ->directory('news')
                        ->visibility('public')
                        ->maxSize(2048)
                        ->helperText('Optional. Up to 2 MB; a wide image works best.')
                        ->columnSpanFull(),
                ]),

            Section::make('English')
                ->schema([
                    TextInput::make('title_en')
                        ->label('Title')
                        ->required()
                        ->maxLength(120)
                        ->live(onBlur: true)
                        ->afterStateUpdated(function (Get $get, Set $set, ?string $state): void {
                            if (blank($get('slug'))) {
                                $set('slug', Str::slug((string) $state));
                            }
                        }),
                    Textarea::make('summary_en')
                        ->label('Summary')
                        ->helperText('Shown on the cards and the banner.')
                        ->required()
                        ->maxLength(220)
                        ->rows(2),
                    MarkdownEditor::make('body_en')
                        ->label('Text')
                        ->required(),
                ]),

            Section::make('Portuguese')
                ->schema([
                    TextInput::make('title_pt')
                        ->label('Título')
                        ->required()
                        ->maxLength(120),
                    Textarea::make('summary_pt')
                        ->label('Resumo')
                        ->required()
                        ->maxLength(220)
                        ->rows(2),
                    MarkdownEditor::make('body_pt')
                        ->label('Texto')
                        ->required(),
                ]),

            Section::make('Home page banner')
                ->description('For one big event at a time. If several are running, the latest published post is shown.')
                ->columns(3)
                ->schema([
                    Toggle::make('is_featured')
                        ->label('Feature on the home page')
                        ->default(false)
                        ->inline(false),
                    DateTimePicker::make('featured_until')
                        ->label('Until')
                        ->helperText('In UTC. The banner disappears by itself after this. Empty keeps it up.')
                        ->native(false),
                    Select::make('banner_theme')
                        ->label('Look')
                        ->options(NewsPost::BANNER_THEMES)
                        ->default('gold')
                        ->required()
                        ->native(false),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('title_en')
                    ->label('Title')
                    ->searchable(['title_en', 'title_pt'])
                    ->limit(60),
                TextColumn::make('category')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => NewsPost::CATEGORIES[$state] ?? $state),
                TextColumn::make('published_at')
                    ->label('Published')
                    ->dateTime('j M Y, H:i')
                    ->placeholder('Draft')
                    ->sortable(),
                IconColumn::make('is_featured')
                    ->label('Banner')
                    ->boolean(),
                TextColumn::make('featured_until')
                    ->label('Banner until')
                    ->dateTime('j M Y, H:i')
                    ->placeholder('—'),
            ])
            ->filters([
                SelectFilter::make('category')->options(NewsPost::CATEGORIES),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListNewsPosts::route('/'),
            'create' => CreateNewsPost::route('/create'),
            'edit' => EditNewsPost::route('/{record}/edit'),
        ];
    }
}
