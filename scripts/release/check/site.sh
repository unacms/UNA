#!/usr/bin/env bash
# One site of the release check, from a package zip.
#
#   site.sh up <name> <package zip> <port>   unpack the zip, start nginx, php and MariaDB (http://localhost:<port>)
#   site.sh install <name> [modules]         install with install/cmd.php; modules: comma separated names,
#                                            default: the list in modules.txt next to this script
#   site.sh php <name> <command...>          run a command in the site's php container, in /opt/una
#   site.sh sql <name> <query>               run a query, tab separated output
#   site.sh dump <name> [mysqldump options]  dump the database to stdout
#   site.sh down <name>                      stop and remove the containers and the database
#
# Sites live in packages/release/check/<name>/. UNA_PHP_IMAGE and UNA_DB_IMAGE choose the images
# (default: built from scripts/docker-compose/PHP.Dockerfile, mariadb:11.8).
set -euo pipefail

cmd=${1:?command}; name=${2:?site name}; shift 2
here=$(cd "$(dirname "$0")" && pwd)
export UNA_REPO=$(cd "$here/../../.." && pwd)
base=${UNA_CHECK_DIR:-$UNA_REPO/packages/release/check}/$name
export UNA_SITE=$base/site
[ -f "$base/port" ] && export UNA_PORT=$(cat "$base/port")
compose() { docker compose -p "una-check-$name" -f "$here/compose.yml" "$@"; }

case $cmd in
up)
    zip=${1:?package zip}; export UNA_PORT=${2:?port}
    rm -rf "$base" && mkdir -p "$base/unzip"
    unzip -q "$zip" -d "$base/unzip"
    mv "$base/unzip/$(ls "$base/unzip" | head -n 1)" "$UNA_SITE" && rmdir "$base/unzip"
    echo "$UNA_PORT" > "$base/port"
    chmod -R a+rwX "$UNA_SITE"
    test -f "$UNA_SITE/plugins/ffmpeg/ffmpeg.exe" && chmod 0755 "$UNA_SITE/plugins/ffmpeg/ffmpeg.exe"
    compose up -d ${UNA_PHP_IMAGE:+--no-build}
    ;;
install)
    modules=${1:-$(tr -d ' \n' < "$here/modules.txt")}
    compose exec -T -w /opt/una php php install/cmd.php -m "$modules" \
        --db_host=mysql --db_port=3306 --db_name=una --db_user=una --db_password=una \
        --server_http_host="localhost:$UNA_PORT" --server_php_self=/install/index.php --server_doc_root=/opt/una/ \
        --site_title="UNA $name" --admin_username=admin --admin_password=unauna
    ;;
php)
    compose exec -T -w /opt/una php "$@"
    ;;
sql)
    compose exec -T mysql mariadb -uuna -puna una -N -B -e "$1"
    ;;
dump)
    compose exec -T mysql mariadb-dump -uuna -puna "$@" una
    ;;
down)
    compose down -v
    ;;
*)
    sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1
    ;;
esac
