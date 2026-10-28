<?php

namespace App\Http\Controllers;

use App\Services\L2j\ItemDatabase;
use App\Services\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public item database: search (/items) and item pages (/items/{id}) with stats, drops at this server's rates,
 * merchants and recipes.
 */
class ItemController extends Controller
{
    public function index(Request $request, ItemDatabase $items): Response
    {
        $filters = [
            'q' => mb_substr((string) $request->query('q', ''), 0, 60),
            'category' => $request->query('category') ?: null,
            'grade' => $request->query('grade') ?: null,
        ];

        return Inertia::render('items/index', [
            'filters' => $filters,
            'loaded' => $items->isLoaded(),
            'results' => fn () => $items->search($filters['q'], $filters['category'], $filters['grade']),
            // Search results and filters are not indexed (endless thin variations); the item pages are.
            'seo' => Seo::make(
                $filters['q'] !== '' ? __('“:q” — Item Search', ['q' => $filters['q']]) : __('Lineage II Essence Item Database'),
                __('Search all 25,129 Lineage II Essence items: weapons, armor and jewelry with stats, drop and spoil chances at our rates, merchants and recipes.'),
                index: $filters['q'] === '' && $filters['category'] === null && $filters['grade'] === null,
                canonical: $request->integer('page') > 1 ? url('/items').'?page='.$request->integer('page') : url('/items'),
            ),
        ]);
    }

    public function show(int $id, ItemDatabase $items): Response
    {
        $item = $items->item($id);

        abort_if($item === null, 404);

        return Inertia::render('items/show', [
            'item' => $item,
            'rates' => $items->rateSummary(),
            'seo' => Seo::make(
                $item['name'].($item['grade'] ? ' '.__('(:grade-grade)', ['grade' => $item['grade']]) : '').' — '.__('Stats, Drops and Where to Buy'),
                $items->description($item),
                jsonLd: [Seo::breadcrumbs([__('Home') => url('/'), __('Items') => url('/items'), $item['name'] => url("/items/{$id}")])],
            ),
        ]);
    }
}
