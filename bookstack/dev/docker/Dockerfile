FROM php:8.3-apache

# Install additional dependencies
RUN apt-get update && \
    apt-get install -y \
    git \
    zip \
    unzip \
    libfreetype-dev \
    libjpeg62-turbo-dev \
    libldap2-dev \
    libpng-dev \
    libzip-dev \
    wait-for-it && \
    rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure ldap --with-libdir="lib/$(gcc -dumpmachine)" && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) pdo_mysql gd ldap zip && \
    pecl install xdebug && \
    docker-php-ext-enable xdebug

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Configure apache
RUN a2enmod rewrite && \
    sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Use the default production configuration and update it as required
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" && \
    sed -i 's/memory_limit = 128M/memory_limit = 512M/g' "$PHP_INI_DIR/php.ini" && \
    sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 500M/g' "$PHP_INI_DIR/php.ini" && \
    sed -i 's/post_max_size = 8M/post_max_size = 500M/g' "$PHP_INI_DIR/php.ini"

ENV APACHE_DOCUMENT_ROOT="/app/public"

WORKDIR /app

# Copy entrypoint scripts to /usr/local/bin (outside /app so volume mounts don't overwrite)
# Convert Windows line endings to Unix and ensure execute permissions
COPY dev/docker/entrypoint.app.sh /usr/local/bin/entrypoint.app.sh
COPY dev/docker/entrypoint.node.sh /usr/local/bin/entrypoint.node.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.*.sh && chmod +x /usr/local/bin/entrypoint.*.sh
