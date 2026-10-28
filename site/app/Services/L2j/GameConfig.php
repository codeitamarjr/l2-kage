<?php

namespace App\Services\L2j;

/**
 * Reads the game server's config the way the server sees it: a key in the overrides (overrides/game/config,
 * mounted read-only) wins over the same key in the sources' defaults (dist/game/config). A key missing from both
 * means the server runs its built-in default, which callers pass as the fallback. L2J Mobius uses "Key = value"
 * .ini files; file names are relative to the config folder (e.g. "Rates.ini", "Custom/ScreenWelcomeMessage.ini").
 */
class GameConfig
{
    /** @var array<string, array<string, string>> */
    private array $files = [];

    public function get(string $file, string $key, string $default): string
    {
        return $this->properties($file)[$key] ?? $default;
    }

    public function number(string $file, string $key, float $default): float
    {
        return (float) $this->get($file, $key, (string) $default);
    }

    public function flag(string $file, string $key, bool $default): bool
    {
        return strtolower($this->get($file, $key, $default ? 'True' : 'False')) === 'true';
    }

    /**
     * @return array<string, string>
     */
    private function properties(string $file): array
    {
        if (isset($this->files[$file])) {
            return $this->files[$file];
        }

        $properties = [];

        foreach ([config('l2j.config_defaults_dir'), config('l2j.config_dir')] as $dir) {
            $path = rtrim((string) $dir, '/').'/'.$file;

            if ($dir === null || ! is_readable($path)) {
                continue;
            }

            foreach (file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                if (preg_match('/^\s*([A-Za-z0-9_.]+)\s*=\s*(.*?)\s*$/', $line, $match)) {
                    $properties[$match[1]] = $match[2];
                }
            }
        }

        return $this->files[$file] = $properties;
    }
}
