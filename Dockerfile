FROM php:8.4-fpm

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git zip unzip libpq-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libonig-dev curl ca-certificates \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_pgsql pgsql gd mbstring zip exif bcmath opcache \
    && pecl install redis || true \
    && docker-php-ext-enable redis || true \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html

RUN git config --global --add safe.directory /var/www/html || true \
    && if [ -f composer.json ]; then composer install --no-interaction --prefer-dist --optimize-autoloader; fi

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

EXPOSE 9000

CMD ["php-fpm"]
