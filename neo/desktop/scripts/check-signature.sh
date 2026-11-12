#!/bin/bash
# Check a built macOS app the way Gatekeeper will, before anyone downloads it.
#
#   scripts/check-signature.sh path/to/App.app           # a release: Developer ID, notarised, stapled
#   scripts/check-signature.sh --local path/to/App.app   # a local build: any identity, not notarised
#
# A release must be signed with a Developer ID Application certificate, with the hardened runtime,
# without the debugging entitlement Xcode adds to development builds, notarised by Apple and with
# the ticket stapled, so the app opens on a Mac that is offline the first time it runs.
set -euo pipefail

local_build=false
if [ "${1:-}" = "--local" ]; then
  local_build=true
  shift
fi
app="${1:?usage: check-signature.sh [--local] path/to/App.app}"
[ -d "$app" ] || { echo "no app at $app" >&2; exit 2; }

fail() { echo "✗ $1" >&2; exit 1; }
ok() { echo "✓ $1"; }

# every nested binary signed, nothing changed since, no unsigned resource
codesign --verify --deep --strict --verbose=2 "$app" 2>&1 | tail -2 || fail "the signature does not verify"
ok "the signature verifies (deep, strict)"

details=$(codesign -dvv "$app" 2>&1)
echo "$details" | grep -qE 'flags=0x[0-9a-f]*\(runtime\)|flags=.*runtime' || fail "the hardened runtime is off (notarisation refuses it)"
ok "hardened runtime"

entitlements=$(codesign -d --entitlements - --xml "$app" 2>/dev/null || true)
if echo "$entitlements" | grep -q 'com.apple.security.get-task-allow'; then
  fail "the app carries get-task-allow (a development entitlement notarisation refuses)"
fi
ok "no development entitlements"

authority=$(echo "$details" | sed -n 's/^Authority=//p' | head -1)
echo "  signed by: ${authority:-nobody}"

if $local_build; then
  ok "a local build: Developer ID, notarisation and Gatekeeper not checked"
  exit 0
fi

case "$authority" in
  "Developer ID Application:"*) ok "Developer ID Application certificate" ;;
  *) fail "not signed with a Developer ID Application certificate (got: ${authority:-none})" ;;
esac

xcrun stapler validate "$app" >/dev/null 2>&1 || fail "no notarisation ticket is stapled"
ok "notarisation ticket stapled"

spctl --assess --type execute --verbose=2 "$app" 2>&1 | grep -q 'accepted' || fail "Gatekeeper does not accept it"
ok "Gatekeeper accepts it ($(spctl --assess --type execute --verbose=2 "$app" 2>&1 | sed -n 's/^source=//p'))"
