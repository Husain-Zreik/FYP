# Deploying the Nuzuh API

This folder contains everything needed to deploy and operate the Laravel backend on a server.

## Prerequisites

- PHP 8.2+ with the extensions Laravel 12 requires (`ext-mbstring`, `ext-pdo_mysql`, `ext-gd`, etc.)
- Composer 2
- MySQL 8 with the `mysql`/`mysqldump` client binaries on `PATH` (used by `backup:database`, see below)
- `git` access to this repository from the server
- A process manager for the queue worker (systemd/Supervisor) if you rely on queued jobs

## First-time server setup

```bash
git clone <repo-url> nuzuh-api
cd nuzuh-api/backend
cp .env.example .env
# edit .env: APP_ENV=production, APP_DEBUG=false, DB_*, APP_URL, etc.
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

## Deploying updates

From the `backend` directory on the server:

```bash
bash deploy/deploy.sh
```

The script (`deploy.sh`):
1. Puts the app into maintenance mode (`artisan down`)
2. Runs `backup:database` so a restore point exists before the migration runs
3. Pulls the target branch (`git fetch` + `git reset --hard origin/<branch>`)
4. Installs production Composer dependencies
5. Runs pending migrations
6. Re-links `storage/app/public` → `public/storage`
7. Rebuilds config/route caches
8. Restarts queue workers
9. Brings the app back up (`artisan up`)

Configure it with environment variables instead of editing the script:

```bash
BRANCH=main RELOAD_FPM=php8.2-fpm bash deploy/deploy.sh
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_DIR` | parent of `deploy/` | Project root to deploy into |
| `BRANCH` | `main` | Git branch to reset to |
| `PHP_BIN` | `php` | PHP binary to invoke |
| `RELOAD_FPM` | *(unset)* | systemd unit to reload after deploy (skipped if unset) |

**Note:** `git reset --hard` discards any local, uncommitted changes in the server's working copy — the server checkout should only ever be updated by this script, never edited by hand.

## Scheduled database backups

`php artisan backup:database` dumps the database with `mysqldump`, gzips it, and stores it at `storage/app/private/backups/backup_YYYY_MM_DD_HHMMSS.sql.gz`. It keeps the 7 most recent backups by default (`--keep=N` to override) and prunes older ones automatically. Database credentials are passed to `mysqldump` via the `MYSQL_PWD` environment variable so they never appear in the process list.

It is scheduled daily at 02:00 in `routes/console.php`. For the schedule to actually fire, the server needs a single cron entry that runs Laravel's scheduler every minute:

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Add it with `crontab -e` under the same user that owns the application files.

### Restoring a backup

```bash
gunzip -c storage/app/private/backups/backup_2026_01_01_020000.sql.gz | mysql -h 127.0.0.1 -u root -p fyp
```

## Queue workers

If any part of the app dispatches queued jobs (`QUEUE_CONNECTION=database`), run a long-lived worker under Supervisor or systemd, e.g.:

```ini
[program:nuzuh-queue-worker]
command=php /path/to/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
```

`deploy.sh` calls `artisan queue:restart` on every deploy, which signals the worker to gracefully restart and pick up the new code.
