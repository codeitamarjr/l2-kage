#!/bin/sh
# Website container start: wait for MariaDB, cache config/routes/views, run migrations, then serve.
set -e
cd /app

echo "[site] Waiting for the database..."
i=0
until php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: 3306).";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); } catch (Throwable $e) { exit(1); }'; do
	i=$((i + 1))
	if [ "$i" -ge 60 ]; then echo "[site] Database not reachable, giving up."; exit 1; fi
	sleep 2
done

if [ "$APP_ENV" = "production" ]; then
	php artisan optimize --no-interaction
fi
php artisan migrate --force --no-interaction
# Item database (/items): reloads only when resources/data/itemdb.ndjson.gz changed.
php artisan itemdb:import --no-interaction

echo "[site] Serving on ${SERVER_NAME}"
exec frankenphp run --config /etc/frankenphp/Caddyfile
