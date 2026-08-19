#!/usr/bin/env bash
# Bring up the existing docker-compose.yml stack for a laptop Docker Desktop loop.
# Does not modify Alex's compose file. Optional: copy compose.override.example.yml
# to compose.override.yml (gitignored) to remap web 80 -> 8088.
set -eu

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is not in PATH" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "error: docker compose is not available (install the Compose plugin)" >&2
  exit 1
fi

if [ ! -f plugins/autoload.php ]; then
  docker run --rm -v "$PWD:/app" -w /app composer:2 install --ignore-platform-reqs --no-interaction
fi

if [ ! -f plugins_public/tailwind/css/tailwind.min.css ] \
  || [ ! -f plugins_public/jquery/jquery.min.js ] \
  || [ ! -f plugins_public/jquery/jquery-migrate.min.js ]; then
  docker run --rm -v "$PWD:/app" -w /app node:22-bookworm-slim sh scripts/build-plugins-public.sh
fi

docker compose up -d --build

echo
echo "UNA local stack is up (existing docker-compose.yml, unchanged)."
echo "  Site:        http://localhost/"
echo "  Installer:   http://localhost/install/"
echo "  phpMyAdmin:  http://localhost:8080"
echo "  Mailpit:     http://localhost:8025"
echo "  MariaDB:     user/pass/db = una/una/una"
echo "  PHP db host: mysql   (use this in the installer, not 127.0.0.1)"
echo
echo "If you copied compose.override.example.yml to compose.override.yml, use"
echo "http://localhost:8088/ and http://localhost:8088/install/ instead."
