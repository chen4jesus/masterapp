FROM caddy:2-alpine

# Copy all static assets into the Caddy serve root
COPY . /srv

# Overlay production config if it exists alongside the source.
# In practice the config is injected at *runtime* via a volume mount
# (see docker-compose.app.yml), so this is just a build-time convenience
# for cases where the file was included in the build context.
RUN [ -f /srv/config.production.json ] && cp /srv/config.production.json /srv/config.json || true

# Inline Caddyfile: serve /srv as a static site on port 80
# gzip/zstd encoding, no-cache for config.json so updates are picked up
RUN printf '\
:80 {\n\
  root * /srv\n\
  file_server\n\
  encode gzip zstd\n\
\n\
  # Prevent stale config on re-deploy\n\
  @config path /config.json\n\
  header @config Cache-Control "no-cache, no-store, must-revalidate"\n\
}\n' > /etc/caddy/Caddyfile

EXPOSE 80
