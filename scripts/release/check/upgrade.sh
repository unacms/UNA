#!/usr/bin/env bash
# Upgrades a site started with site.sh the way an admin does from the command line:
# the system patch first, then the update packs of the installed modules.
#
#   upgrade.sh <site name> <patch zip> <system version of the packs> [repository with the packs]
#   upgrade.sh upgrade packages/release/UNA-Patch-v.15.0.0.RC4-to-v.15.0.0.RC5.zip 15.0.0-RC5
#
# The repository (default: this one) is where modules/*/*/updates/ are read from: the packs whose
# compatible_with is the given system version. scripts/manage.php is copied from it too, since
# packages do not carry scripts/.
set -euo pipefail

name=${1:?site name}; patch=${2:?patch zip}; version=${3:?system version}
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "${4:-$here/../../..}" && pwd)
base=${UNA_CHECK_DIR:-$(cd "$here/../../.." && pwd)/packages/release/check}/$name
site=$base/site
manage() { "$here/site.sh" php "$name" php scripts/manage.php -u .. "$@"; }

mkdir -p "$site/scripts" && cp "$repo/scripts/manage.php" "$site/scripts/"
rm -rf "$site/tmp/patch" && mkdir -p "$site/tmp/patch" && unzip -q "$patch" -d "$site/tmp/patch"
chmod -R a+rwX "$site/tmp/patch" "$site/scripts"

echo "== System patch"
manage -c update -o "patch=/opt/una/tmp/patch/$(ls "$site/tmp/patch" | head -n 1)/"
"$here/site.sh" sql "$name" "SELECT CONCAT('system version: ', version) FROM sys_modules WHERE name = 'system'"

echo "== Module packs"
installed=$("$here/site.sh" sql "$name" "SELECT name FROM sys_modules")
modules=
for config in "$repo"/modules/*/*/updates/*/install/config.php; do
    grep -q "'$version'" "$config" || continue
    pack=$(dirname "$(dirname "$config")")
    module=$(dirname "$(dirname "$pack")")
    rel=${module#"$repo"/}
    [ -d "$site/$rel" ] || continue
    module_name=$(sed -n "s/^[[:space:]]*'name' => '\([^']*\)'.*/\1/p" "$site/$rel/install/config.php" | head -n 1)
    echo "$installed" | grep -qx "$module_name" || continue
    mkdir -p "$site/$rel/updates"
    rm -rf "$site/$rel/updates/update_$(basename "$pack")"
    cp -R "$pack" "$site/$rel/updates/update_$(basename "$pack")"
    modules="$modules,$module_name"
done
chmod -R a+rwX "$site/modules"
manage -c update_modules -o "${modules#,}"
