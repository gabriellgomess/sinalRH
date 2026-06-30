# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Sinal RH — API Laravel (produção: nginx + php-fpm + supervisor)
# Build: Docker (Easypanel). Worker de fila e scheduler embutidos.
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.2-fpm-bookworm

# Dependências de sistema + nginx + supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl unzip ca-certificates \
        libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libonig-dev libicu-dev libxml2-dev \
        nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

# Extensões PHP necessárias (pdo_mysql, gd p/ dompdf/intervention, etc.)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql mbstring zip gd bcmath intl exif pcntl opcache

# Extensão Redis (PECL) — usada se QUEUE/CACHE = redis
RUN pecl install redis && docker-php-ext-enable redis

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 1) Instala dependências PHP primeiro (camada de cache do Docker)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader

# 2) Copia o código da aplicação
COPY . .

# 3) Finaliza autoload e instala as configs de runtime
RUN composer dump-autoload --optimize --no-dev \
    && cp docker/php.ini        /usr/local/etc/php/conf.d/zz-app.ini \
    && cp docker/nginx.conf     /etc/nginx/sites-available/default \
    && cp docker/supervisord.conf /etc/supervisor/conf.d/app.conf \
    && cp docker/entrypoint.sh  /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /var/log/supervisor \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
