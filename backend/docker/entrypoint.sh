#!/bin/sh
set -e

cd /var/www/html

# Garante a estrutura do storage (o volume persistente pode iniciar vazio)
mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    storage/app/nr1 \
    storage/app/tmp \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Link público do storage (idempotente)
php artisan storage:link || true

# Migrations (idempotente; --force para ambiente de produção)
php artisan migrate --force

# Cache de config e views (route:cache é omitido de propósito:
# routes/api.php usa Closure no /ping, que não é serializável)
php artisan config:cache
php artisan view:cache

# Sobe nginx + php-fpm + worker de fila + scheduler
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/app.conf
