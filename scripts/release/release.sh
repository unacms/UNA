#!/usr/bin/env bash
# Prepares a UNA release on a release branch. Nothing is pushed, tagged or published here.
#
#   scripts/release/release.sh prepare 15.0.0-RC5 --from 15.0.0-RC4 [--first-packs] [--no-pack-for <module>]...
#       1. sets BX_DOL_VERSION (inc/version.inc.php, install/index.php)
#       2. writes module update packs (files, languages, migrations) and the version migrations
#       3. sets module versions for the release (no .DEV)
#       4. commits, builds the package from that commit in a container
#       5. writes the system update pack from the previous release's zip and the new package, commits
#       --first-packs also makes a first update pack (X to X.Y.Z+1, the whole module) for every changed module
#       that never had one; --no-pack-for leaves a module out of that.
#
#   scripts/release/release.sh package 15.0.0-RC5 --from 15.0.0-RC4
#       builds UNA-Patch-v.<from>-to-v.<version>.zip from HEAD, next to the package that prepare built.
#
#   scripts/release/release.sh back-to-dev <commit before the release commit>
#       module versions back to .DEV, as one commit. Run it on a branch made after the release is tagged.
#
# The previous release's zip is taken from packages/release/UNA-v.<from>.zip, or downloaded from the
# GitHub release <from> when it is not there.
set -euo pipefail

cmd=${1:-}; shift || true
root=$(git rev-parse --show-toplevel)
cd "$root"
here=scripts/release
out=packages/release
image=una-release-build

die() { echo "release.sh: $*" >&2; exit 1; }
dotted() { echo "${1//-/.}"; }

need_clean_branch() {
    [ -z "$(git status --porcelain)" ] || die "the working tree has changes; commit or remove them first"
    [ "$(git rev-parse --abbrev-ref HEAD)" != "master" ] || die "run this on a release branch, not on master"
}

parse() {
    version=${1:-}; shift || true
    from=
    date=$(date +%Y%m%d)
    first=()
    while [ $# -gt 0 ]; do
        case $1 in
            --from) from=$2; shift 2 ;;
            --date) date=$2; shift 2 ;;
            --first-packs) first+=(--first-packs); shift ;;
            --no-pack-for) first+=(--exclude "$2"); shift 2 ;;
            *) die "unknown option $1" ;;
        esac
    done
    [ -n "$version" ] || die "version is required, for example 15.0.0-RC5"
    [ -n "$from" ] || die "--from <previous version> is required"
    git rev-parse -q --verify "refs/tags/$from" > /dev/null || die "no tag $from"
}

previous_tree() {
    local zip="$out/UNA-v.$from.zip"
    mkdir -p "$out"
    [ -f "$zip" ] || gh release download "$from" -D "$out" -p "UNA-v.$from.zip"
    rm -rf "$out/tree-$from" && mkdir -p "$out/tree-$from"
    unzip -q "$zip" -d "$out/tree-$from"
    echo "$out/tree-$from/$(ls "$out/tree-$from" | head -n 1)"
}

case $cmd in
prepare)
    parse "$@"
    need_clean_branch

    current=$(sed -n "s/^define('BX_DOL_VERSION', '\([^']*\)').*/\1/p" inc/version.inc.php)
    [ -n "$current" ] || die "BX_DOL_VERSION was not found in inc/version.inc.php"
    if [ "$current" = "$version" ]; then
        echo "== The version is $version already: continuing with the package and the system update pack"
    else
        perl -pi -e "s/(define\('BX_DOL_VERSION', ')[^']*'/\${1}$version'/" inc/version.inc.php
        perl -pi -e "s/(define \('BX_DOL_VER', ')[^']*'/\${1}$version'/" install/index.php
        grep -q "'BX_DOL_VERSION', '$version'" inc/version.inc.php || die "inc/version.inc.php was not changed"
        grep -q "'BX_DOL_VER', '$version'" install/index.php || die "install/index.php was not changed"

        mkdir -p "$out"
        echo "== Module update packs"
        python3 $here/packs.py modules --since "$from" --to-ref HEAD --system-version "$version" \
            --date "$date" --min-system-version "$from" ${first[@]+"${first[@]}"} | tee "$out/modules.txt"
        echo "== Module versions"
        python3 $here/packs.py versions --mode release --write | tail -n 1

        python3 $here/packs.py system-finish --from "$from" --to "$version" --date "$date"

        git add -A inc/version.inc.php install/index.php modules migrations
        git commit -q -m "Release $version: version, module versions, module update packs"
    fi

    echo "== Package"
    $here/build.sh HEAD "UNA-v.$version" "$out"
    rm -rf "$out/tree-$version" && mkdir -p "$out/tree-$version"
    unzip -q "$out/UNA-v.$version.zip" -d "$out/tree-$version"

    echo "== System update pack"
    python3 $here/packs.py system --old-tree "$(previous_tree)" --new-tree "$out/tree-$version/UNA-v.$version" \
        --from "$from" --to "$version"
    echo "== Build outputs of modules"
    python3 $here/packs.py built --new-tree "$out/tree-$version/UNA-v.$version" --system-version "$version"
    git add -A upgrade/files modules
    git commit -q -m "Release $version: system update pack, build outputs in module packs"

    echo
    echo "Packs carry no SQL: they run the migrations they bring. Next:"
    echo "  - check the release: scripts/release/check/ (fresh site, upgraded site, comparison)"
    echo "  - then: $here/release.sh package $version --from $from"
    ;;

package)
    parse "$@"
    [ -z "$(git status --porcelain)" ] || die "the working tree has changes; commit them first"
    # Packs are not part of the package, so the zip that prepare built stays valid while only packs changed.
    # Building it again could differ (Messenger installs its npm dependencies without a lockfile), and the
    # system update pack was made from that zip.
    built=$(cat "$out/UNA-v.$version.commit" 2> /dev/null || true)
    if [ -n "$built" ] && [ -f "$out/UNA-v.$version.zip" ] \
        && git diff --quiet "$built" HEAD -- . ':!upgrade' ':!modules/*/*/updates' ':!scripts' ':!tests'; then
        echo "== UNA-v.$version.zip from $built is current"
    else
        die "the code changed since the package was built ($built): run prepare again on a fresh release branch, the system update pack depends on it"
    fi

    src=$(mktemp -d "${TMPDIR:-/tmp}/una-release-patch.XXXXXX")
    trap 'rm -rf "$src"' EXIT
    git archive HEAD build.xml upgrade | tar -x -C "$src"
    docker run --rm -v "$src":/src -v "$root/$out":/out "$image" bash -euc '
        phing -Dversion_from="'"$(dotted "$from")"'" -Dversion_to="'"$(dotted "$version")"'" package_upgrade
        cp packages/UNA-Patch-*.zip /out/'
    ls -la "$out"/*.zip
    ;;

back-to-dev)
    need_clean_branch
    [ -n "${1:-}" ] || die "give the commit before the release commit, where modules without packs take their version from"
    python3 $here/packs.py versions --mode dev --orig-ref "$1" --write
    git add -A modules
    git commit -q -m "Modules: back to DEV"
    ;;

*)
    sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
