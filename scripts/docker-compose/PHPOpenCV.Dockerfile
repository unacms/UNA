############################
# 1. Builder stage
############################
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /build

# Build dependencies
RUN apt update && apt install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    checkinstall \
    gcc-arm-linux-gnueabi \
    python3 \
    libjpeg-dev \
    libpng-dev \
    software-properties-common \
    wget \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# PHP dev
RUN add-apt-repository ppa:ondrej/php \
 && apt update \
 && apt install -y \
    php8.3-dev \
    php8.3-cli \
 && rm -rf /var/lib/apt/lists/*

# OpenCV sources
RUN git clone --depth 1 --branch 4.7.0 https://github.com/opencv/opencv.git \
 && git clone --depth 1 --branch 4.7.0 https://github.com/opencv/opencv_contrib.git

# Build OpenCV
RUN mkdir /build/opencv/build \
 && cd /build/opencv/build \
 && cmake \
    -D CMAKE_BUILD_TYPE=RELEASE \
    -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D OPENCV_GENERATE_PKGCONFIG=YES \
    -D OPENCV_EXTRA_MODULES_PATH=/build/opencv_contrib/modules \
    .. \
 && make -j$(nproc) \
 && make install

# Build php-opencv extension
RUN git clone https://github.com/php-opencv/php-opencv.git \
 && cd php-opencv \
 && phpize \
 && ./configure --with-php-config=/usr/bin/php-config \
 && make \
 && make install

############################
# 2. Runtime stage (MINIMAL)
############################
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /

RUN apt update && apt install -y --no-install-recommends \
    software-properties-common \
    gnupg \
    ca-certificates \
  && add-apt-repository ppa:ondrej/php

# Runtime dependencies only
RUN apt update && apt install -y --no-install-recommends \
    php8.3-fpm \
    php8.3-cli \
    php8.3-gd \
    php8.3-curl \
    php8.3-zip \
    php8.3-xml \
    php8.3-mbstring \
    php8.3-mysql \
    php8.3-imagick \
    php8.3-redis \
    php8.3-intl \
    php8.3-xdebug \
    libjpeg-turbo8 \
    libpng16-16 \
    libstdc++6 \
    libgcc-s1 \
    netcat-traditional \
    iputils-ping \
    msmtp-mta \
 && rm -rf /var/lib/apt/lists/*

# Copy OpenCV runtime libs
COPY --from=builder /usr/local /usr/local

# Copy PHP extension
COPY --from=builder /usr/lib/php/20230831/opencv.so /usr/lib/php/20230831/

# Enable extension
RUN echo "extension=opencv.so" \
    > /etc/php/8.3/cli/conf.d/20-opencv.ini \
 && echo "extension=opencv.so" \
    > /etc/php/8.3/fpm/conf.d/20-opencv.ini

# PHP-FPM config
RUN sed -i 's|listen = .*|listen = 9000|' /etc/php/8.3/fpm/pool.d/www.conf \
 && mkdir -p /var/run/php

EXPOSE 9000
CMD ["/usr/sbin/php-fpm8.3", "-F"]
