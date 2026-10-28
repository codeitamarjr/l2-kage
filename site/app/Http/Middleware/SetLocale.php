<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * The site's language for this request: the visitor's choice (the "locale" cookie, set by the EN | PT switch), or
 * else Brazilian Portuguese for browsers that ask for Portuguese, and English for everyone else.
 */
class SetLocale
{
    /** Languages the site is written in; English is the fallback. */
    public const LOCALES = ['en', 'pt_BR'];

    public const COOKIE = 'locale';

    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale(self::detect($request));

        return $next($request);
    }

    public static function detect(Request $request): string
    {
        $chosen = $request->cookie(self::COOKIE);

        if (is_string($chosen) && in_array($chosen, self::LOCALES, true)) {
            return $chosen;
        }

        $preferred = (string) $request->getPreferredLanguage(['en', 'pt_BR', 'pt']);

        return str_starts_with($preferred, 'pt') ? 'pt_BR' : 'en';
    }
}
