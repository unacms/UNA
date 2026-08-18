#!/bin/sh
# Produce gitignored plugins_public assets the UNA preloader expects:
#   plugins_public/tailwind/css/tailwind.min.css
#   plugins_public/jquery/jquery.min.js
#   plugins_public/jquery/jquery-migrate.min.js
# Uses documented package.json scripts.
# Does not vendor minified files into git.
set -eu
cd "$(dirname "$0")/.."
if ! command -v npm >/dev/null 2>&1; then
  exit 1
fi

# Skip package.json postinstall (full frontend build).
# Include devDependencies so tailwindcss is present.
if [ ! -x node_modules/.bin/tailwindcss ] || [ ! -f node_modules/jquery/dist/jquery.min.js ]; then
  npm install --ignore-scripts --include=dev
fi

mkdir -p plugins_public/tailwind/css plugins_public/jquery
npm run build:tailwind-min
npm run build:jquery

test -s plugins_public/tailwind/css/tailwind.min.css
test -s plugins_public/jquery/jquery.min.js
test -s plugins_public/jquery/jquery-migrate.min.js
