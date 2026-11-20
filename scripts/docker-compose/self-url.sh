#!/bin/sh
# Entrypoint wrapper of the php and cron containers. UNA requests its own URL
# (image transcoding, link previews, ...). With the site at http://localhost:<UNA_PORT>
# that address points at this container, so forward the port to nginx (web).
if [ -n "$UNA_PORT" ]; then
    (while :; do
        socat TCP-LISTEN:"$UNA_PORT",bind=127.0.0.1,fork,reuseaddr TCP:web:"$UNA_PORT"
        sleep 1
    done) &
fi
exec "$@"
