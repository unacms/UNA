#!/bin/sh
set -eu

cd /var/www/html

PORT="${PORT:-80}"
if [ "$PORT" != "80" ]; then
    sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
    sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf
fi
a2dismod mpm_event mpm_worker >/dev/null 2>&1 || true
a2enmod mpm_prefork rewrite >/dev/null 2>&1 || true

mkdir -p cache cache_public logs tmp storage
chmod a+rwX inc cache cache_public logs tmp storage
if [ -f plugins/ffmpeg/ffmpeg.exe ]; then
    chmod 0755 plugins/ffmpeg/ffmpeg.exe
fi

parse_mysql_url() {
    _url="$1"
    _url="${_url#mysql://}"
    _url="${_url#mariadb://}"
    DB_USER="${_url%%:*}"
    _url="${_url#*:}"
    DB_PASSWORD="${_url%%@*}"
    _url="${_url#*@}"
    _hostport="${_url%%/*}"
    DB_NAME="${_url#*/}"
    DB_NAME="${DB_NAME%%\?*}"
    case "$_hostport" in
        *:*)
            DB_HOST="${_hostport%:*}"
            DB_PORT="${_hostport##*:}"
            ;;
        *)
            DB_HOST="$_hostport"
            DB_PORT="3306"
            ;;
    esac
}

DB_URL="${DATABASE_URL:-${MYSQL_URL:-${MARIADB_PRIVATE_URL:-${MARIADB_URL:-}}}}"
if [ -n "$DB_URL" ]; then
    parse_mysql_url "$DB_URL"
else
    DB_HOST="${MYSQLHOST:-${MARIADB_HOST:-${MARIADBHOST:-mariadb.railway.internal}}}"
    DB_PORT="${MYSQLPORT:-${MARIADB_PORT:-${MARIADBPORT:-3306}}}"
    DB_NAME="${MYSQLDATABASE:-${MARIADB_DATABASE:-una}}"
    DB_USER="${MYSQLUSER:-${MARIADB_USER:-una}}"
    DB_PASSWORD="${MYSQLPASSWORD:-${MARIADB_PASSWORD:-una}}"
fi

export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
export UNA_DB_HOST="$DB_HOST"
export UNA_DB_PORT="$DB_PORT"
export UNA_DB_NAME="$DB_NAME"
export UNA_DB_USER="$DB_USER"
export UNA_DB_PWD="$DB_PASSWORD"
export UNA_ROOT_DIR=/var/www/html/
export UNA_AUTO_HOSTNAME=1
export UNA_SKIP_INSTALL_FOLDER_CHECK=1
export UNA_SKIP_REDIRECT=1

db_status() {
    php -r '
        $m = @new mysqli(
            getenv("DB_HOST"),
            getenv("DB_USER"),
            getenv("DB_PASSWORD"),
            getenv("DB_NAME"),
            (int)(getenv("DB_PORT") ?: 3306)
        );
        if ($m->connect_error) {
            fwrite(STDERR, $m->connect_error . "\n");
            exit(1);
        }
        $r = $m->query("SHOW TABLES LIKE \"sys_options\"");
        exit($r && $r->num_rows ? 0 : 2);
    '
}

echo "Waiting for MariaDB at ${DB_HOST}:${DB_PORT}..."
i=0
rc=1
set +e
while [ "$i" -lt 60 ]; do
    db_status
    rc=$?
    if [ "$rc" -eq 0 ] || [ "$rc" -eq 2 ]; then
        break
    fi
    i=$((i + 1))
    sleep 2
done
set -e

if [ "$rc" -eq 1 ]; then
    echo "MariaDB is not reachable" >&2
    exit 1
fi

if [ "$rc" -eq 2 ]; then
    echo "Installing UNA with cmd.php..."
    php install/cmd.php \
        --db_host="$DB_HOST" \
        --db_port="$DB_PORT" \
        --db_name="$DB_NAME" \
        --db_user="$DB_USER" \
        --db_password="$DB_PASSWORD" \
        --server_http_host="${RAILWAY_PUBLIC_DOMAIN:-localhost}" \
        --server_php_self=/install/index.php \
        --server_doc_root=/var/www/html/ \
        --site_title="${UNA_SITE_TITLE:-UNA}" \
        --admin_username="${UNA_ADMIN_USERNAME:-admin}" \
        --admin_password="${UNA_ADMIN_PASSWORD:-unauna}"
else
    echo "UNA already installed; writing header from environment."
    if [ ! -f inc/header.inc.php ]; then
        cp install/patterns/header.inc.php inc/header.inc.php
        chmod 0666 inc/header.inc.php
    fi
fi

chown -R www-data:www-data inc cache cache_public logs tmp storage

exec "$@"
