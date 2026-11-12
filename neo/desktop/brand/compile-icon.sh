#!/bin/sh
# Compile brand/AppIcon.icon (an Icon Composer file) into what the macOS bundle takes:
# brand/icons/Assets.car (the icon's light, dark, clear and tinted versions, shown by macOS 26) and
# brand/icons/icon.icns (the same icon for earlier macOS). Needs Xcode 26 or later (actool), so it
# runs on a Mac; the compiled files are committed. Then run node brand/apply.mjs.
#
#     sh brand/compile-icon.sh
set -eu
cd "$(dirname "$0")"
[ -d AppIcon.icon ] || { echo "brand/AppIcon.icon is missing" >&2; exit 1; }
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
xcrun actool "$PWD/AppIcon.icon" --compile "$out" --app-icon AppIcon --platform macosx \
    --minimum-deployment-target 14.0 --output-partial-info-plist "$out/partial.plist" >/dev/null
cp "$out/Assets.car" icons/Assets.car
cp "$out/AppIcon.icns" icons/icon.icns
echo "brand/icons/Assets.car and brand/icons/icon.icns: written"
