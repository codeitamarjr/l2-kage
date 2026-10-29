<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuses AI and scraper bots (config/crawlers.php) with 403, by User-Agent. robots.txt stays readable so a polite bot
 * can see it is not welcome. Search engines and link-preview bots are not on the list.
 */
class BlockCrawlers
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('crawlers.enabled') && ! $request->is('robots.txt') && $this->isBlocked((string) $request->userAgent())) {
            return response('Automated access is not allowed.', 403, ['Content-Type' => 'text/plain; charset=UTF-8', 'X-Robots-Tag' => 'noindex']);
        }

        return $next($request);
    }

    private function isBlocked(string $userAgent): bool
    {
        if ($userAgent === '') {
            return false;
        }

        $agent = strtolower($userAgent);

        foreach (array_diff(config('crawlers.robots'), config('crawlers.robots_only')) as $bot) {
            if (str_contains($agent, strtolower($bot))) {
                return true;
            }
        }

        return false;
    }
}
