# Multi-stage build for production Hugo site
# Stage 1: Build the site
FROM node:23-alpine AS builder

# Set environment variables for versions
ARG HUGO_VERSION=0.151.0
ARG GO_VERSION=1.24.0

# Install build dependencies and Hugo
RUN apk add --no-cache \
  git \
  wget \
  tar \
  go \
  build-base \
  hugo \
  tzdata

# Verify Hugo installation
RUN hugo version && echo "Hugo installed successfully"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the Hugo site
RUN npm run build

# Stage 2: Production server with Caddy and API
FROM caddy:alpine

# Install Node.js, Hugo, Go, Git, tzdata, and inotify-tools for runtime rebuilds
RUN apk add --no-cache nodejs npm hugo go git tzdata inotify-tools

# Set working directory
WORKDIR /app

# Copy all project files (not just built site)
COPY --from=builder /app /app

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Create Caddy html directory and copy built site
RUN mkdir -p /usr/share/caddy/html && \
  cp -r /app/public/* /usr/share/caddy/html/

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
  echo 'set -e' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo 'echo "Starting Reformed Blog container..."' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo '# Check if volumes need to be initialized' >> /entrypoint.sh && \
  echo 'if [ ! -f "/app/content/chinese/blog/.initialized" ]; then' >> /entrypoint.sh && \
  echo '  echo "Initializing blog content volume..."' >> /entrypoint.sh && \
  echo '  mkdir -p /app/content/chinese/blog' >> /entrypoint.sh && \
  echo '  touch /app/content/chinese/blog/.initialized' >> /entrypoint.sh && \
  echo 'fi' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo 'if [ ! -f "/app/assets/images/.initialized" ]; then' >> /entrypoint.sh && \
  echo '  echo "Initializing images volume..."' >> /entrypoint.sh && \
  echo '  mkdir -p /app/assets/images' >> /entrypoint.sh && \
  echo '  touch /app/assets/images/.initialized' >> /entrypoint.sh && \
  echo 'fi' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo '# Build the site' >> /entrypoint.sh && \
  echo 'echo "Building Hugo site..."' >> /entrypoint.sh && \
  echo 'cd /app && npm run build' >> /entrypoint.sh && \
  echo 'cp -r /app/public/* /usr/share/caddy/html/' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo '# Start API server in background' >> /entrypoint.sh && \
  echo 'echo "Starting API server on port 3000..."' >> /entrypoint.sh && \
  echo 'cd /app && node scripts/apiServer.js &' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo '# Start file watcher in background' >> /entrypoint.sh && \
  echo 'echo "Starting file watcher..."' >> /entrypoint.sh && \
  echo '(' >> /entrypoint.sh && \
  echo '  while true; do' >> /entrypoint.sh && \
  echo '    inotifywait -r -e modify,create,delete,move /app/content/chinese/blog /app/assets/images 2>/dev/null &&' >> /entrypoint.sh && \
  echo '      cd /app && npm run build &&' >> /entrypoint.sh && \
  echo '      cp -r /app/public/* /usr/share/caddy/html/ &&' >> /entrypoint.sh && \
  echo '      echo "Site rebuilt at $(date)"' >> /entrypoint.sh && \
  echo '    sleep 2' >> /entrypoint.sh && \
  echo '  done' >> /entrypoint.sh && \
  echo ') &' >> /entrypoint.sh && \
  echo '' >> /entrypoint.sh && \
  echo '# Start Caddy' >> /entrypoint.sh && \
  echo 'echo "Starting Caddy web server..."' >> /entrypoint.sh && \
  echo 'exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile' >> /entrypoint.sh && \
  chmod +x /entrypoint.sh

# Expose ports 80 and 443
EXPOSE 80 443 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start the entrypoint script
CMD ["/entrypoint.sh"]
