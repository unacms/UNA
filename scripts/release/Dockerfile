# Build image for release packages: PHP 8.3 (the minimum UNA supports), Composer, Node 24, yarn and Phing,
# the same tools the CI job "package" uses, and a compiler for Messenger's native npm dependencies.
# See scripts/release/build.sh.
FROM node:24-slim AS node
FROM composer:2 AS composer

FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip zip patch curl ca-certificates libicu-dev libzip-dev \
        python3 make g++ \
    && docker-php-ext-install -j"$(nproc)" intl zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/local/bin/composer
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node /opt /opt
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && for bin in /opt/yarn-*/bin/yarn /opt/yarn-*/bin/yarnpkg; do ln -s "$bin" /usr/local/bin/; done

RUN curl -fsSL -o /usr/local/bin/phing https://github.com/phingofficial/phing/releases/download/3.1.0/phing-3.1.0.phar \
    && chmod 0755 /usr/local/bin/phing

ENV COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_CACHE_DIR=/cache/composer YARN_CACHE_FOLDER=/cache/yarn
WORKDIR /src
