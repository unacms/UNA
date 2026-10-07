#!/usr/bin/env bash
# The NEO web client as service `neo` in the una-ci Railway project, next to `una` and `mariadb`.
# Used by .github/workflows/ci.yml. Kept out of the workflow because Railway's reference syntax
# (${{una.UNA_API_KEY}}) is also GitHub Actions expression syntax.
#
#   neo.sh instance <environment>                 give <environment> a neo instance if it has none
#   neo.sh vars <environment> <una-url> <app-url> set the variables the build and the server need
#   neo.sh stage <dir>                            NEO sources plus scripts/railway/neo/* in <dir>
#
# Environment: RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID.
set -euo pipefail

NEO_SERVICE=neo
die() { echo "neo.sh: $*" >&2; exit 1; }

# Railway services are project-scoped, but an environment only runs the services it has an
# instance of. PR environments get theirs by duplicating pr-template; one duplicated before
# the neo service existed, or the template itself, gets it through a config patch.
instance() {
    local env=$1 env_id service_id
    if railway service status --service "$NEO_SERVICE" --environment "$env" >/dev/null 2>&1; then
        echo "neo: $env has a $NEO_SERVICE instance"
        return
    fi
    [ -n "${RAILWAY_PROJECT_ID:-}" ] || die "RAILWAY_PROJECT_ID is not set"
    local project
    project=$(railway api 'query($id: String!) { project(id: $id) { environments { edges { node { id name } } } services { edges { node { id name } } } } }' \
        --variables "$(jq -nc --arg id "$RAILWAY_PROJECT_ID" '{id: $id}')")
    env_id=$(jq -r --arg e "$env" '.data.project.environments.edges[].node | select(.name == $e) | .id' <<< "$project")
    service_id=$(jq -r --arg s "$NEO_SERVICE" '.data.project.services.edges[].node | select(.name == $s) | .id' <<< "$project")
    [ -n "$env_id" ] || die "no environment $env"
    [ -n "$service_id" ] || die "no service $NEO_SERVICE in the project"
    railway api 'mutation($e: String!, $p: EnvironmentConfig!) { environmentPatchCommit(environmentId: $e, patch: $p, commitMessage: "Add neo service", skipDeploys: true) }' \
        --variables "$(jq -nc --arg e "$env_id" --arg s "$service_id" \
            '{e: $e, p: {services: {($s): {isCreated: true, build: {builder: "DOCKERFILE"}}}}}')" >/dev/null
    for _ in $(seq 1 12); do
        railway service status --service "$NEO_SERVICE" --environment "$env" >/dev/null 2>&1 && { echo "neo: added a $NEO_SERVICE instance to $env"; return; }
        sleep 5
    done
    die "the $NEO_SERVICE instance did not appear in $env"
}

# UNA_API_KEY references the una service's own variable, so the key lives in one place and
# Railway shows the two services as connected. <una-url> may be a reference too.
vars() {
    local env=$1 una_url=$2 app_url=$3
    railway variable set --service "$NEO_SERVICE" --environment "$env" --skip-deploys \
        "UNA_URL=$una_url" \
        "NEXT_PUBLIC_UNA_URL=$una_url" \
        "APP_URL=$app_url" \
        "NEXT_PUBLIC_APP_URL=$app_url" \
        'UNA_API_KEY=${{una.UNA_API_KEY}}'
}

stage() {
    local dir=$1 root
    root=$(git rev-parse --show-toplevel)
    rm -rf "$dir"
    mkdir -p "$dir"
    git -C "$root" archive HEAD neo | tar -x --strip-components=1 -C "$dir"
    cp "$root/scripts/railway/neo/Dockerfile" "$root/scripts/railway/neo/railway.toml" "$root/scripts/railway/neo/.dockerignore" "$dir/"
}

case "${1:-}" in
    instance) instance "${2:?environment}" ;;
    vars)     vars "${2:?environment}" "${3:?una-url}" "${4:?app-url}" ;;
    stage)    stage "${2:?dir}" ;;
    *) die "usage: neo.sh instance|vars|stage ..." ;;
esac
