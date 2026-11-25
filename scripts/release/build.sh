#!/usr/bin/env bash
# Builds a UNA package from a git ref, in a container, the way the CI job "package" does:
# composer install --no-dev, yarn install, phing package.
#
#   scripts/release/build.sh <git ref> <package name> [output folder]
#   scripts/release/build.sh 15.0.0-RC4 UNA-v.15.0.0-RC4
#
# Writes <output folder>/<package name>.zip (default folder: packages/release). The sources come from
# `git archive`, so uncommitted changes and untracked files never get into a package.
set -euo pipefail

ref=${1:?git ref}
name=${2:?package name, for example UNA-v.15.0.0-RC5}
root=$(git rev-parse --show-toplevel)
out=${3:-$root/packages/release}
image=una-release-build

commit=$(git -C "$root" rev-parse --verify "$ref^{commit}")
mkdir -p "$out"
out=$(cd "$out" && pwd)
src=$(mktemp -d "${TMPDIR:-/tmp}/una-release-src.XXXXXX")
trap 'rm -rf "$src"' EXIT

echo "Building $name from $commit"
git -C "$root" archive "$commit" | tar -x -C "$src"

docker build -q -t "$image" "$root/scripts/release" > /dev/null
docker run --rm \
    -v "$src":/src \
    -v "$out":/out \
    -v una-release-cache:/cache \
    "$image" bash -euc '
        # highlight.js stamps its bundle with `git rev-parse HEAD`. The sources here are an archive, so give it
        # a repository whose one commit always has the same hash: the bundle then changes only with highlight.js.
        export GIT_AUTHOR_DATE="2000-01-01T00:00:00Z" GIT_COMMITTER_DATE="2000-01-01T00:00:00Z"
        git init -q . && git -c user.name=release -c user.email=release@localhost commit -q --allow-empty -m release
        composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader --ignore-platform-req="ext-*"
        yarn install --frozen-lockfile --non-interactive
        rm -rf .git
        # The yarn build chains its steps with ";", so a failed step does not stop it. A missing bundle would
        # end up in the next patch as a file to delete.
        for built in plugins_public/highlight/highlight.min.js plugins_public/bundle.js plugins/autoload.php; do
            test -s "$built" || { echo "build.sh: $built was not built" >&2; exit 1; }
        done
        test -f plugins/ffmpeg/ffmpeg.exe && chmod 0755 plugins/ffmpeg/ffmpeg.exe
        phing -Dpackage_name="'"$name"'" -Dpackage_file="'"$name"'.zip" package
        cp "packages/'"$name"'.zip" /out/
    '

echo "$commit" > "$out/$name.commit"
echo "$out/$name.zip"
