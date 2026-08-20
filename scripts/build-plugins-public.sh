#!/bin/sh
# Produce gitignored plugins_public assets the UNA preloader expects.
# Uses documented package.json scripts. Does not vendor minified files into git.
# Skips package.json postinstall (full frontend build + bower + git deps).
set -eu
cd "$(dirname "$0")/.."
if ! command -v npm >/dev/null 2>&1; then
  exit 1
fi

if [ ! -x node_modules/.bin/tailwindcss ] || [ ! -f node_modules/jquery/dist/jquery.min.js ]; then
  npm install --ignore-scripts --include=dev
fi

# Every page (sys_preloader js_system / css_system) plus Studio launcher extras
# that do not need bower or git-url packages.
for target in \
  build:tailwind-min \
  build:jquery \
  build:jquery-ui \
  build:jquery-easing \
  build:jquery-cookie \
  build:jquery-form \
  build:jquery-resize \
  build:spin.js \
  build:moment \
  build:marka \
  build:headroom \
  build:at.js \
  build:prismjs \
  build:htmx \
  build:pusher \
  build:hammerjs
do
  npm run "$target"
done

test -s plugins_public/tailwind/css/tailwind.min.css
test -s plugins_public/jquery/jquery.min.js
test -s plugins_public/jquery/jquery-migrate.min.js
test -s plugins_public/jquery-ui/jquery-ui.min.js
test -s plugins_public/jquery.easing.js
test -s plugins_public/jquery.cookie.min.js
test -s plugins_public/jquery.form.min.js
