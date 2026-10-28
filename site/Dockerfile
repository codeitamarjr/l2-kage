# L2 Kage website: Laravel + Inertia + React + Filament on FrankenPHP (Caddy). Multi-arch base images,
# built for the host's architecture by docker compose.

# ---- PHP runtime base ----
FROM dunglas/frankenphp:1-php8.5-alpine AS php-base
WORKDIR /app
RUN install-php-extensions pdo_mysql opcache intl zip bcmath
RUN { \
    echo "memory_limit = 256M"; \
    echo "expose_php = Off"; \
    echo "opcache.enable = 1"; \
    echo "opcache.validate_timestamps = 0"; \
    } > /usr/local/etc/php/conf.d/site.ini

# ---- PHP dependencies ----
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-autoloader --no-scripts --prefer-dist --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts

# ---- Front-end build (Vite: React pages, CSS, fonts) ----
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY vite.config.ts tsconfig.json ./
COPY resources/ resources/
COPY public/ public/
RUN npm run build

# ---- Runtime ----
FROM php-base
COPY --from=vendor /app /app
COPY --from=frontend /app/public/build /app/public/build
# Package discovery and Filament's published assets, with a throwaway config (no database needed).
RUN APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= DB_CONNECTION=sqlite DB_DATABASE=":memory:" \
    CACHE_STORE=array SESSION_DRIVER=array \
    sh -c "php artisan package:discover --ansi && php artisan filament:assets" \
    && rm -f bootstrap/cache/config.php \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/site-entrypoint
RUN chmod 755 /usr/local/bin/site-entrypoint

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    SERVER_NAME=:80

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD wget -qO- http://127.0.0.1/up >/dev/null || exit 1
ENTRYPOINT ["site-entrypoint"]
