FROM caddy:2-alpine

# Copy all static assets into the Caddy serve root
COPY . /srv

# Overlay the production config so the container always uses the live API URL.
# To customise at runtime, bind-mount your own config.json over /srv/config.json.
RUN cp /srv/config.production.json /srv/config.json

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
