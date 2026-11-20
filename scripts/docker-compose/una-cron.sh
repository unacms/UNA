#!/bin/sh
# Runs UNA's periodic/cron.php once; the crontab of the cron container calls it every minute.
cd /opt/una || exit 1
# Nothing to do until the installer has written the site config.
[ -f inc/header.inc.php ] || exit 0
/usr/local/bin/php periodic/cron.php 2>&1 \
    | sed -e '/^[[:space:]]*$/d' -e "s/^/[$(date '+%Y-%m-%d %H:%M:%S')] /" \
    >> /var/log/unacron.log
