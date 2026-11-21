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
    && pecl install xdebug \
    && pecl install imagick-3.8.0 \
    && pecl install igbinary \
    && pecl install --configureoptions 'enable-redis-igbinary="yes" enable-redis-lzf="no" enable-redis-zstd="no" enable-redis-msgpack="no" enable-redis-lz4="no" with-liblz4="yes"' redis \
    && docker-php-ext-enable xdebug imagick igbinary redis

# ============================
# Stage 2: Production runtime
# ============================
FROM php:8.3-fpm-trixie

# Install only runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    msmtp-mta \
    socat \
    libpng-tools \
    libjpeg62-turbo \
    libfreetype6 \
    libmagickwand-7.q16-10 \
    libzip5 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled PHP extensions and config from builder
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d

COPY scripts/docker-compose/self-url.sh /usr/local/bin/una-self-url
RUN chmod 0755 /usr/local/bin/una-self-url

ENTRYPOINT ["una-self-url", "docker-php-entrypoint"]
CMD ["php-fpm"]
