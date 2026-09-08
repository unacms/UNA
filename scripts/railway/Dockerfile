FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd mysqli pdo_mysql zip exif opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

RUN printf '%s\n' \
        'short_open_tag=On' \
        'memory_limit=256M' \
        'upload_max_filesize=64M' \
        'post_max_size=64M' \
        'max_input_vars=5000' \
        'variables_order=EGPCS' \
        > /usr/local/etc/php/conf.d/una.ini

COPY --chown=www-data:www-data . /var/www/html

RUN mv /var/www/html/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && rm -f /var/www/html/Dockerfile /var/www/html/railway.toml \
    && mkdir -p /var/www/html/cache /var/www/html/cache_public /var/www/html/logs /var/www/html/tmp /var/www/html/storage \
    && chown -R www-data:www-data \
        /var/www/html/inc \
        /var/www/html/cache \
        /var/www/html/cache_public \
        /var/www/html/logs \
        /var/www/html/tmp \
        /var/www/html/storage \
    && if [ -f /var/www/html/plugins/ffmpeg/ffmpeg.exe ]; then chmod 0755 /var/www/html/plugins/ffmpeg/ffmpeg.exe; fi

WORKDIR /var/www/html
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
