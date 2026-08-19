# Local Docker Desktop loop

Laptop-only notes for the existing `docker-compose.yml` stack. This file and
`scripts/local-dev.sh` are additive: they do not change Alex's compose, the
Railway/Railpack files, the PHP/Cron Dockerfiles, or the install wizard.

There is no FrankenPHP, Swoole, or RoadRunner in this loop. The stack is
nginx (`web`) + PHP-FPM (`php`) as already defined in `docker-compose.yml`.

## Git vs instance state

Git is the code. The running site has instance state that is **not** in git
and must not be wiped casually:

| State | Where | Notes |
| --- | --- | --- |
| Site config | `inc/header.inc.php` | Written by the installer. Gitignored (`inc/header*`). Holds DB credentials and the site URL. |
| Database | `mysqldata` named volume | Survives `docker compose down`. Destroyed by `docker compose down -v`. |
| Uploads / generated files | `storage/` (bind-mounted) | Lives on the host checkout. |
| Frontend vendor assets | `plugins_public/` | Gitignored. Built by `scripts/build-plugins-public.sh` (Tailwind + jQuery). Required before the first page load. |

Composer `vendor-dir` is `plugins` (gitignored), not `vendor/`. There is no
`vendor/autoload.php`. `local-dev.sh` runs `composer:2 install` only on first
run, when `plugins/autoload.php` is missing. `--no-scripts` is omitted so the
existing post-install (ffmpeg relocate + amazon-s3 patch) runs once; otherwise
`ffmpeg.exe` never lands. Repeat runs skip Composer entirely if
`plugins/autoload.php` already exists.

## First run

From the repo root (Docker Desktop running):

```bash
./scripts/local-dev.sh
```

The script uses the existing compose file unchanged. It:

1. First run only: if `plugins/autoload.php` is missing, installs PHP deps with `composer:2 install --ignore-platform-reqs --no-interaction` (no `--no-scripts`, so ffmpeg relocate + amazon-s3 patch run once). Repeat runs do not invoke Composer.
2. Builds `plugins_public` with `node:22-bookworm-slim` if Tailwind/jQuery assets are missing (via `scripts/build-plugins-public.sh`).
3. Runs `docker compose up -d --build`.

Then open the installer and use these fields (they match Alex's compose):

| Installer field | Value |
| --- | --- |
| Database host | `mysql` (the Compose service name; the PHP container cannot reach MariaDB as `localhost`) |
| Database user / password / name | `una` / `una` / `una` |
| Site URL | `http://localhost/` — or `http://localhost:8088/` if you use the port override below |

Default URLs from `docker-compose.yml`:

- Site: http://localhost/
- Installer: http://localhost/install/
- phpMyAdmin: http://localhost:8080
- Mailpit: http://localhost:8025
- MariaDB published on host `:3306` (user/pass/db `una`/`una`/`una`; root/`root`)

Services (do not rename): `web` (nginx `:80`), `php`, `cron`, `mysql` (MariaDB),
`jot` (`:5555`), `phpmyadmin` (`:8080`), `mailpit` (`:8025`).

## Optional host port 8088

If something else already owns host port 80, copy the example overlay:

```bash
cp compose.override.example.yml compose.override.yml
```

`compose.override.yml` is gitignored and auto-loaded by Docker Compose. The
example uses Compose `ports: !override` on the `web` service so `8088:80`
**replaces** the `80:80` mapping instead of adding a second one.

Then use `http://localhost:8088/` and `http://localhost:8088/install/` as the
site URL. phpMyAdmin (`:8080`) and Mailpit (`:8025`) are unchanged.

## Reset this laptop instance

Wipes the MariaDB volume and the generated site config so the installer runs
again. Does not change git.

```bash
docker compose down -v && rm -f inc/header.inc.php
```

Re-run `./scripts/local-dev.sh` afterwards.

## Branch / PR / Railway split

- **This branch** is a laptop Docker Desktop loop only.
- **Railway** is periodic staging. Do not point Railway at this branch. Do not
  change live Railway config from here.
- Never wipe `inc/header.inc.php` via a Railway `startCommand`. The live
  start-command restore of `header.inc.php` (and `/app/storage/plugins_public`)
  is the safety net; see `railway.toml`.
- Do not merge until Tech QA. Do not squash-merge this PR. Do not Railway-redeploy
  from this work.

## What not to change

Leave bit-identical to `master`: `docker-compose.yml`, `railway.toml`,
`railpack.json`, `scripts/docker-compose/PHP.Dockerfile`,
`scripts/docker-compose/Cron.Dockerfile`, and everything under `install/`.
