#!/usr/bin/env bash
# Railway custom domains on unacms.app (DNS hosted by Vercel) and NEO client aliases.
# Used by .github/workflows/ci.yml; every subcommand is idempotent.
#
#   domains.sh api-domain <host> <railway-environment>   custom domain for service `una`, plus its DNS records
#   domains.sh dns-remove <host>                         delete the records api-domain created for <host>
#   domains.sh client-alias <host> [branch]              point <host> at the NEO client build of <branch>
#                                                        (latest ready preview), or production when there is none
#   domains.sh client-unalias <host>
#
# Environment: VERCEL_TOKEN, RAILWAY_PROJECT_ID (api-domain), RAILWAY_API_TOKEN (railway CLI),
#   VERCEL_TEAM (team slug or id; found from DNS_ZONE ownership when unset),
#   DNS_ZONE (default unacms.app), CLIENT_PROJECT (Vercel project of the NEO client; when unset
#   or not found, the project that has DNS_ZONE attached).
set -euo pipefail

DNS_ZONE="${DNS_ZONE:-unacms.app}"
CLIENT_PROJECT="${CLIENT_PROJECT:-}"
RAILWAY_SERVICE="${RAILWAY_SERVICE:-una}"
# Apache listens on Railway's $PORT (entrypoint.sh), which Railway sets to 8080.
RAILWAY_TARGET_PORT="${RAILWAY_TARGET_PORT:-8080}"
VERCEL_API=https://api.vercel.com

die() { echo "domains.sh: $*" >&2; exit 1; }
[ -n "${VERCEL_TOKEN:-}" ] || die "VERCEL_TOKEN is not set"

vercel() { # vercel <METHOD> <path> [json-body]
    local method=$1 path=$2 body=${3:-}
    local sep='?'; case "$path" in *\?*) sep='&' ;; esac
    local url="$VERCEL_API$path${TEAM_ID:+${sep}teamId=$TEAM_ID}${TEAM_SLUG:+${sep}slug=$TEAM_SLUG}"
    local out code
    out=$(mktemp)
    code=$(curl -sS -o "$out" -w '%{http_code}' -X "$method" -H "Authorization: Bearer $VERCEL_TOKEN" \
        ${body:+-H 'Content-Type: application/json' -d "$body"} "$url") || code=000
    if [ "${code:0:1}" != 2 ]; then
        # Vercel explains 403s (token scope, team access) in the body; show it.
        echo "vercel: $method ${path%%\?*} -> HTTP $code: $(jq -r '.error.message // .error.code // empty' "$out" 2>/dev/null)" >&2
        rm -f "$out"
        return 1
    fi
    cat "$out"
    rm -f "$out"
}

# The Vercel scope that owns DNS_ZONE (it also owns the client project): VERCEL_TEAM when
# that works, else the token's personal account, else any team the token can list.
# Logs which scope it used, and Vercel's reason when none works (usually token scope).
TEAM_ID=""
TEAM_SLUG=""
owns_zone() { vercel GET "/v5/domains/$DNS_ZONE" >/dev/null; }
resolve_team() {
    local team
    if [ -n "${VERCEL_TEAM:-}" ]; then
        case "$VERCEL_TEAM" in team_*) TEAM_ID=$VERCEL_TEAM ;; *) TEAM_SLUG=$VERCEL_TEAM ;; esac
        if owns_zone 2>/dev/null; then echo "vercel: scope $VERCEL_TEAM" >&2; return; fi
        echo "vercel: $DNS_ZONE is not in scope $VERCEL_TEAM, trying the token's other scopes" >&2
        TEAM_ID=""; TEAM_SLUG=""
    fi
    if owns_zone 2>/dev/null; then echo "vercel: personal scope" >&2; return; fi
    for team in $(vercel GET /v2/teams 2>/dev/null | jq -r '.teams[].id'); do
        TEAM_ID=$team
        if owns_zone 2>/dev/null; then echo "vercel: scope $team" >&2; return; fi
    done
    TEAM_ID=""
    owns_zone || true # print Vercel's reason
    die "VERCEL_TOKEN has no scope that owns $DNS_ZONE (check the token's scope in Vercel)"
}

label_of() { # api-pr-12.unacms.app -> api-pr-12
    local host=$1
    [ "${host%."$DNS_ZONE"}" != "$host" ] || die "$host is not in $DNS_ZONE"
    echo "${host%."$DNS_ZONE"}"
}

# All records of DNS_ZONE as one JSON array (Vercel pages them; follow `pagination.next`).
dns_records() {
    local page next="" all="[]"
    while :; do
        page=$(vercel GET "/v4/domains/$DNS_ZONE/records?limit=100${next:+&until=$next}")
        all=$(jq -c --argjson a "$all" '$a + .records' <<< "$page")
        next=$(jq -r '.pagination.next // empty' <<< "$page")
        [ -n "$next" ] || break
    done
    echo "$all"
}

dns_has() { # dns_has <name> <type> <value>
    dns_records | jq -e --arg n "$1" --arg t "$2" --arg v "$3" 'any(.[]; .name == $n and .type == $t and .value == $v)' >/dev/null
}

dns_upsert() { # dns_upsert <name> <type> <value>
    local name=$1 type=$2 value=$3 id val
    while read -r id val; do
        [ -n "$id" ] || continue
        if [ "$val" = "$value" ]; then echo "dns: $type $name ok"; return; fi
        vercel DELETE "/v2/domains/$DNS_ZONE/records/$id" >/dev/null
    done < <(dns_records | jq -r --arg n "$name" --arg t "$type" '.[] | select(.name == $n and .type == $t) | "\(.id) \(.value)"')
    vercel POST "/v2/domains/$DNS_ZONE/records" \
        "$(jq -nc --arg n "$name" --arg t "$type" --arg v "$value" '{name: $n, type: $t, value: $v, ttl: 60}')" >/dev/null
    # Read it back: a record that silently didn't stick left previews without an API host.
    local try
    for try in 1 2 3; do
        dns_has "$name" "$type" "$value" && { echo "dns: $type $name -> $value"; return; }
        sleep 2
    done
    die "dns: $type $name was not found after writing it"
}

dns_remove() { # dns_remove <name>  (also its _railway-verify TXT)
    local name=$1 id
    while read -r id; do
        [ -n "$id" ] || continue
        vercel DELETE "/v2/domains/$DNS_ZONE/records/$id" >/dev/null && echo "dns: removed record $id"
    done < <(dns_records | jq -r --arg n "$name" --arg v "_railway-verify.$name" '.[] | select(.name == $n or .name == $v) | .id')
}

api_domain() { # api_domain <host> <environment>
    local host=$1 env=$2 label id status
    label=$(label_of "$host")
    [ -n "${RAILWAY_PROJECT_ID:-}" ] || die "RAILWAY_PROJECT_ID is not set"

    railway domain "$host" --service "$RAILWAY_SERVICE" --environment "$env" --port "$RAILWAY_TARGET_PORT" --json >/dev/null 2>&1 || true
    local domains env_id
    domains=$(railway domain list --service "$RAILWAY_SERVICE" --environment "$env" --json)
    id=$(jq -r --arg h "$host" '.domains[] | select(.type == "custom" and .domain == $h) | .id' <<< "$domains")
    [ -n "$id" ] || die "Railway did not create $host"

    # Domains created earlier pointed at port 80 and answered 502; keep them on the app's port.
    if [ "$(jq -r --arg h "$host" '.domains[] | select(.domain == $h) | .targetPort' <<< "$domains")" != "$RAILWAY_TARGET_PORT" ]; then
        env_id=$(railway status --json | jq -r --arg e "$env" '.environments.edges[].node | select(.name == $e) | .id')
        railway api 'mutation($id: String!, $environmentId: String!, $port: Int) { customDomainUpdate(id: $id, environmentId: $environmentId, targetPort: $port) }' \
            --variables "$(jq -nc --arg id "$id" --arg e "$env_id" --argjson p "$RAILWAY_TARGET_PORT" '{id: $id, environmentId: $e, port: $p}')" >/dev/null
        echo "api: $host now targets port $RAILWAY_TARGET_PORT"
    fi

    status=$(railway api 'query($id: String!, $projectId: String!) { customDomain(id: $id, projectId: $projectId) { status { verificationDnsHost verificationToken dnsRecords { hostlabel recordType requiredValue } } } }' \
        --variables "$(jq -nc --arg id "$id" --arg p "$RAILWAY_PROJECT_ID" '{id: $id, projectId: $p}')")

    # Not a pipeline: dns_upsert must run in this shell so a failure fails the job.
    local name type value
    while read -r name type value; do
        dns_upsert "$name" "$type" "$value"
    done < <(jq -r '.data.customDomain.status.dnsRecords[] | "\(.hostlabel) \(.recordType | sub("DNS_RECORD_TYPE_"; "")) \(.requiredValue)"' <<< "$status")

    local vhost vtoken
    vhost=$(jq -r '.data.customDomain.status.verificationDnsHost // empty' <<< "$status")
    vtoken=$(jq -r '.data.customDomain.status.verificationToken // empty' <<< "$status")
    [ -z "$vhost" ] || dns_upsert "$vhost" TXT "$vtoken"
    echo "api: https://$host ($label)"
}

# The client project: CLIENT_PROJECT when set, else the project that serves DNS_ZONE
# (by attached domain, so a renamed or similarly named project can't be picked by mistake).
client_project_id() {
    local id p
    if [ -n "$CLIENT_PROJECT" ]; then
        id=$(vercel GET "/v9/projects/$CLIENT_PROJECT" | jq -r '.id // empty')
        [ -n "$id" ] || die "Vercel project $CLIENT_PROJECT not found"
        echo "$id"; return
    fi
    for p in $(vercel GET "/v9/projects?limit=100" | jq -r '.projects[].id'); do
        if vercel GET "/v9/projects/$p/domains?limit=100" | jq -e --arg z "$DNS_ZONE" '.domains[] | select(.name == $z or .name == ("www." + $z))' >/dev/null; then
            echo "client: project $(vercel GET "/v9/projects/$p" | jq -r .name) serves $DNS_ZONE" >&2
            echo "$p"; return
        fi
    done
    die "no Vercel project serves $DNS_ZONE"
}

client_alias() { # client_alias <host> [branch]
    local host=$1 branch=${2:-} project uid=""
    project=$(client_project_id)
    if [ -n "$branch" ]; then
        uid=$(vercel GET "/v6/deployments?projectId=$project&state=READY&limit=100" \
            | jq -r --arg b "$branch" '[.deployments[] | select(.meta.githubCommitRef == $b)] | sort_by(.created) | last | .uid // empty')
    fi
    if [ -n "$uid" ]; then
        echo "client: branch $branch"
    else
        uid=$(vercel GET "/v6/deployments?projectId=$project&target=production&state=READY&limit=1" | jq -r '.deployments[0].uid // empty')
        [ -n "$uid" ] || die "no ready production deployment of the client project"
        echo "client: production"
    fi
    vercel POST "/v2/deployments/$uid/aliases" "$(jq -nc --arg a "$host" '{alias: $a}')" >/dev/null
    echo "client: https://$host"
}

client_unalias() {
    vercel DELETE "/v2/aliases/$1" >/dev/null 2>&1 && echo "client: removed $1" || echo "client: $1 had no alias"
}

resolve_team
case "${1:-}" in
    api-domain)     api_domain "${2:?host}" "${3:?environment}" ;;
    dns-remove)     dns_remove "$(label_of "${2:?host}")" ;;
    client-alias)   client_alias "${2:?host}" "${3:-}" ;;
    client-unalias) client_unalias "${2:?host}" ;;
    *) die "usage: domains.sh api-domain|dns-remove|client-alias|client-unalias ..." ;;
esac
