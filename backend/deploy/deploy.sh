#!/usr/bin/env bash
#
# Deploy script for the Nuzuh Laravel API.
# Run this ON THE SERVER, from inside the backend project directory (or set APP_DIR).
#
#   bash deploy/deploy.sh
#
# Configurable via environment variables:
#   APP_DIR       Path to the backend project root (default: script's parent directory)
#   BRANCH        Git branch to deploy (default: main)
#   PHP_BIN       PHP binary to use (default: php)
#   RELOAD_FPM    systemd service name to reload after deploy, e.g. php8.2-fpm (default: unset — skipped)

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BRANCH="${BRANCH:-main}"
PHP_BIN="${PHP_BIN:-php}"

cd "$APP_DIR"

echo "==> Deploying branch [$BRANCH] in $APP_DIR"

echo "==> Putting application into maintenance mode"
"$PHP_BIN" artisan down --retry=5 || true

echo "==> Backing up the database before migrating"
"$PHP_BIN" artisan backup:database

echo "==> Pulling latest code"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing composer dependencies"
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Running database migrations"
"$PHP_BIN" artisan migrate --force

echo "==> Linking public storage"
"$PHP_BIN" artisan storage:link || true

echo "==> Caching configuration and routes"
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache

echo "==> Restarting queue workers"
"$PHP_BIN" artisan queue:restart

if [[ -n "${RELOAD_FPM:-}" ]]; then
    echo "==> Reloading $RELOAD_FPM"
    sudo systemctl reload "$RELOAD_FPM"
fi

echo "==> Bringing application back up"
"$PHP_BIN" artisan up

echo "==> Deploy complete"
