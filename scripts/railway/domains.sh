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
#   DNS_ZONE (default unacms.app), CLIENT_PROJECT (default neo-ci).
set -euo pipefail

DNS_ZONE="${DNS_ZONE:-unacms.app}"
CLIENT_PROJECT="${CLIENT_PROJECT:-neo-ci}"
RAILWAY_SERVICE="${RAILWAY_SERVICE:-una}"
VERCEL_API=https://api.vercel.com

die() { echo "domains.sh: $*" >&2; exit 1; }
[ -n "${VERCEL_TOKEN:-}" ] || die "VERCEL_TOKEN is not set"

vercel() { # vercel <METHOD> <path> [json-body]
    local method=$1 path=$2 body=${3:-}
    local sep='?'; case "$path" in *\?*) sep='&' ;; esac
    local url="$VERCEL_API$path${TEAM_ID:+${sep}teamId=$TEAM_ID}"
    if [ -n "$body" ]; then
        curl -fsS -X "$method" -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' -d "$body" "$url"
    else
        curl -fsS -X "$method" -H "Authorization: Bearer $VERCEL_TOKEN" "$url"
    fi
}

# The Vercel team (or personal account) that owns DNS_ZONE; it also owns the client project.
TEAM_ID=""
resolve_team() {
    local team
    for team in "" $(TEAM_ID="" vercel GET /v2/teams | jq -r '.teams[].id'); do
        if TEAM_ID="$team" vercel GET "/v5/domains/$DNS_ZONE" >/dev/null 2>&1; then
            TEAM_ID="$team"
            return
        fi
    done
    die "no Vercel team with access to $DNS_ZONE"
}

label_of() { # api-pr-12.unacms.app -> api-pr-12
    local host=$1
    [ "${host%."$DNS_ZONE"}" != "$host" ] || die "$host is not in $DNS_ZONE"
    echo "${host%."$DNS_ZONE"}"
}

dns_upsert() { # dns_upsert <name> <type> <value>
    local name=$1 type=$2 value=$3 current
    current=$(vercel GET "/v4/domains/$DNS_ZONE/records?limit=100" \
        | jq -r --arg n "$name" --arg t "$type" '.records[] | select(.name == $n and .type == $t) | "\(.id) \(.value)"')
    while read -r id val; do
        [ -n "$id" ] || continue
        if [ "$val" = "$value" ]; then echo "dns: $type $name ok"; return; fi
        vercel DELETE "/v2/domains/$DNS_ZONE/records/$id" >/dev/null
    done <<< "$current"
    vercel POST "/v2/domains/$DNS_ZONE/records" \
        "$(jq -nc --arg n "$name" --arg t "$type" --arg v "$value" '{name: $n, type: $t, value: $v, ttl: 60}')" >/dev/null
    echo "dns: $type $name -> $value"
}

dns_remove() { # dns_remove <name>  (also its _railway-verify TXT)
    local name=$1
    vercel GET "/v4/domains/$DNS_ZONE/records?limit=100" \
        | jq -r --arg n "$name" --arg v "_railway-verify.$name" '.records[] | select(.name == $n or .name == $v) | .id' \
        | while read -r id; do
            vercel DELETE "/v2/domains/$DNS_ZONE/records/$id" >/dev/null && echo "dns: removed record $id"
        done
}

api_domain() { # api_domain <host> <environment>
    local host=$1 env=$2 label id status
    label=$(label_of "$host")
    [ -n "${RAILWAY_PROJECT_ID:-}" ] || die "RAILWAY_PROJECT_ID is not set"

    railway domain "$host" --service "$RAILWAY_SERVICE" --environment "$env" --port 80 --json >/dev/null 2>&1 || true
    id=$(railway domain list --service "$RAILWAY_SERVICE" --environment "$env" --json \
        | jq -r --arg h "$host" '.domains[] | select(.type == "custom" and .domain == $h) | .id')
    [ -n "$id" ] || die "Railway did not create $host"

    status=$(railway api 'query($id: String!, $projectId: String!) { customDomain(id: $id, projectId: $projectId) { status { verificationDnsHost verificationToken dnsRecords { hostlabel recordType requiredValue } } } }' \
        --variables "$(jq -nc --arg id "$id" --arg p "$RAILWAY_PROJECT_ID" '{id: $id, projectId: $p}')")

    jq -r '.data.customDomain.status.dnsRecords[] | "\(.hostlabel) \(.recordType | sub("DNS_RECORD_TYPE_"; "")) \(.requiredValue)"' <<< "$status" \
        | while read -r name type value; do dns_upsert "$name" "$type" "$value"; done

    local vhost vtoken
    vhost=$(jq -r '.data.customDomain.status.verificationDnsHost // empty' <<< "$status")
    vtoken=$(jq -r '.data.customDomain.status.verificationToken // empty' <<< "$status")
    [ -z "$vhost" ] || dns_upsert "$vhost" TXT "$vtoken"
    echo "api: https://$host ($label)"
}

client_alias() { # client_alias <host> [branch]
    local host=$1 branch=${2:-} project uid=""
    project=$(vercel GET "/v9/projects/$CLIENT_PROJECT" | jq -r '.id')
    if [ -n "$branch" ]; then
        uid=$(vercel GET "/v6/deployments?projectId=$project&state=READY&limit=100" \
            | jq -r --arg b "$branch" '[.deployments[] | select(.meta.githubCommitRef == $b)] | sort_by(.created) | last | .uid // empty')
    fi
    if [ -n "$uid" ]; then
        echo "client: $CLIENT_PROJECT branch $branch"
    else
        uid=$(vercel GET "/v6/deployments?projectId=$project&target=production&state=READY&limit=1" | jq -r '.deployments[0].uid // empty')
        [ -n "$uid" ] || die "no ready production deployment of $CLIENT_PROJECT"
        echo "client: $CLIENT_PROJECT production"
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
