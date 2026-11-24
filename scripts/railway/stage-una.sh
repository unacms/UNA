#!/usr/bin/env bash
# The directory `railway up` deploys for service `una`: the install package that CI built, plus
# the Railway build files next to this script. Used by .github/workflows/ci.yml.
#
#   stage-una.sh <dir with the package zip> <output dir>
set -euo pipefail

packages=$1
out=$2
here=$(cd "$(dirname "$0")" && pwd)
unpacked=$(mktemp -d)

rm -rf "$out"
mkdir -p "$out"
unzip -q "$packages"/*.zip -d "$unpacked"
pkg_dir=$(find "$unpacked" -mindepth 1 -maxdepth 1 -type d | head -n 1)
cp -a "$pkg_dir"/. "$out"/
cp "$here"/Dockerfile "$here"/entrypoint.sh "$here"/railway.toml "$here"/.railwayignore \
    "$here"/configure.php "$here"/seed.php "$here"/languages.php "$out"/
chmod +x "$out"/entrypoint.sh
