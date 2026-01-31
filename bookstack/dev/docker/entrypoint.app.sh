#!/bin/bash

set -e

env

if [[ -n "$1" ]]; then
    exec "$@"
else
    # Restore assets if missing (common when mounting volumes)
    if [ ! -d "/app/public/dist" ] || [ -z "$(ls -A /app/public/dist)" ]; then
        echo "Restoring built assets from backup..."
        mkdir -p /app/public/dist
        cp -R /usr/local/bin/bookstack_dist_backup/* /app/public/dist/
    fi

    composer install
    wait-for-it bookstack-db:3306 -t 45
    php artisan migrate --database=mysql --force
    chown -R www-data storage public/uploads bootstrap/cache public/dist
    exec apache2-foreground
fi
