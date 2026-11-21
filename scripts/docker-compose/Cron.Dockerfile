# ============================
# Stage 1: Builder
# ============================
FROM php:8.3-fpm-trixie AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libonig-dev \
        libmagickwand-dev \
        libzip-dev \
        unzip \
        pkg-config \
        autoconf \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Configure & install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql mysqli zip exif opcache iconv mbstring \
    && pecl install imagick-3.8.0 \
    && pecl install igbinary \
    && pecl install --configureoptions 'enable-redis-igbinary="yes" enable-redis-lzf="no" enable-redis-zstd="no" enable-redis-msgpack="no" enable-redis-lz4="no" with-liblz4="yes"' redis \
    && docker-php-ext-enable imagick igbinary redis
    
# ============================
# Stage 2: Production runtime
# ============================
FROM php:8.3-fpm-trixie

# Install only runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    msmtp-mta \
    socat \
    tini \
    cron \
    libpng-tools \
    libjpeg62-turbo \
    libfreetype6 \
    libmagickwand-7.q16-10 \
    libzip5 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled PHP extensions and config from builder
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d

# UNA's cron runs every minute as www-data, like PHP-FPM, so the cache files it
# writes stay writable by the site. It reads the php.ini that docker-compose.yml
# mounts at /usr/local/etc/php/php.ini. Output lines (blank ones dropped) go to
# /var/log/unacron.log with a timestamp; `docker compose logs cron` shows them.
COPY scripts/docker-compose/una-cron.sh /usr/local/bin/una-cron
COPY scripts/docker-compose/self-url.sh /usr/local/bin/una-self-url
RUN chmod 0755 /usr/local/bin/una-cron /usr/local/bin/una-self-url \
    && touch /var/log/unacron.log && chown www-data:www-data /var/log/unacron.log \
    && echo "* * * * * /usr/local/bin/una-cron" | crontab -u www-data -

ENTRYPOINT ["/usr/bin/tini", "--", "una-self-url"]
CMD ["sh", "-c", "cron && exec tail -n 0 -F /var/log/unacron.log"]
