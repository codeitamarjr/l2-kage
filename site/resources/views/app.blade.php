<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0d0b09">
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
        {{-- The visitor's theme (header toggle, saved in this browser), applied before the first paint so there's no flash. --}}
        <script>
            try { if (localStorage.getItem('theme') === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}
        </script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        {{-- Search and share metadata from the page's "seo" prop (App\Services\Seo), rendered here so crawlers and link
             previews that don't run JavaScript see it. The layout keeps the title in sync while browsing. --}}
        @php
            $seo = $page['props']['seo'] ?? \App\Services\Seo::make(null, 'A free Lineage II Essence server on the Samurai Crow update. A blade drawn in silence, a shadow over Aden.');
        @endphp
        <x-inertia::head>
            <title>{{ $seo['title'] }}</title>
        </x-inertia::head>
        <meta name="description" content="{{ $seo['description'] }}">
        <meta name="robots" content="{{ $seo['robots'] }}{{ config('crawlers.enabled') ? ', noai, noimageai' : '' }}">
        @if (config('crawlers.enabled'))
            {{-- Opt out of AI training and text and data mining (W3C TDMRep). --}}
            <meta name="tdm-reservation" content="1">
        @endif
        <link rel="canonical" href="{{ $seo['canonical'] }}">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ \App\Services\Seo::brand() }}">
        <meta property="og:locale" content="en_US">
        <meta property="og:title" content="{{ $seo['title'] }}">
        <meta property="og:description" content="{{ $seo['description'] }}">
        <meta property="og:url" content="{{ $seo['canonical'] }}">
        <meta property="og:image" content="{{ $seo['image'] }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="A castle on the cliffs of Aden under a blood-red moon, with dragons in the sky">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seo['title'] }}">
        <meta name="twitter:description" content="{{ $seo['description'] }}">
        <meta name="twitter:image" content="{{ $seo['image'] }}">
        @foreach ($seo['jsonLd'] as $data)
            <script type="application/ld+json">{!! json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}</script>
        @endforeach
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
