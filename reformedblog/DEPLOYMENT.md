# Docker Deployment Guide for Ubuntu Server

This guide will help you deploy the Reformed Blog on an Ubuntu server using Docker, Docker Compose, and Caddy web server.

## Architecture

This deployment includes:
- **Hugo Static Site**: Your blog content served by Caddy
- **Node.js API Server**: REST API for blog post management (port 3000)
- **Caddy Web Server**: Reverse proxy, automatic HTTPS, static file serving

## Why Caddy?

Caddy is a modern, production-ready web server with automatic HTTPS:
- **Automatic HTTPS**: Free SSL certificates via Let's Encrypt
- **Simple Configuration**: Easy-to-read Caddyfile format
- **HTTP/3 Support**: Cutting-edge performance
- **No Manual Renewal**: Certificates auto-renew in the background
- **Built-in Reverse Proxy**: Seamlessly proxies API requests

## Prerequisites

Ensure your Ubuntu server has the following installed:

### 1. Install Docker
```bash
# Update package index
sudo apt-get update

# Install necessary packages
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker run hello-world
```

### 2. Manage Docker as Non-Root User (Optional but Recommended)
```bash
# Create docker group
sudo groupadd docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
# Or use:
newgrp docker

# Verify
docker run hello-world
```

### 3. Enable Docker to Start on Boot
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 4. Configure Firewall
```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow HTTPS traffic
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

## Deployment Steps

### Step 1: Prepare Your Server

Clone or upload your project to the server:

```bash
# Clone from git repository
git clone <your-repository-url> /var/www/reformed-blog
cd /var/www/reformed-blog

# OR upload files using scp/rsync
# scp -r /path/to/project/* user@your-server:/var/www/reformed-blog
```

### Step 2: Configure Domain (for Automatic HTTPS)

Edit [Caddyfile](Caddyfile) and uncomment the production section:

```caddy
# Replace with your actual domain
your-domain.com {
    root * /usr/share/caddy/html
    file_server
    encode gzip
    # ... rest of configuration
}
```

**If you don't have a domain yet**, the default configuration will work with your server IP address on HTTP only.

### Step 3: Configure Environment Variables

Edit [docker-compose.yml](docker-compose.yml) if needed:

```yaml
environment:
  - TZ=America/New_York  # Change to your timezone
  - API_KEY=your-secure-api-key  # Change from default!
```

**Important**: The default API key is `development-api-key`. Change this to a secure random string for production!

### Step 4: Build and Start the Container

```bash
# Build the Docker image
docker-compose build

# Start the container in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check if container is running
docker-compose ps

# Check container health
docker inspect --format='{{.State.Health.Status}}' reformed-blog

# Test the site
curl http://localhost
# Or from your browser: http://your-server-ip

# Test the API
curl -H "X-API-Key: development-api-key" http://localhost/api/v1/blog
```

## API Usage

The blog includes a REST API for creating posts programmatically.

### Create a Blog Post

```bash
curl -X POST http://your-server-ip/api/v1/blog \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "title": "My New Post",
    "content": "This is the content of my blog post.",
    "author": "Your Name",
    "categories": ["Theology"],
    "tags": ["grace", "salvation"],
    "description": "A brief description",
    "draft": false
  }'
```

### API Endpoint

- **URL**: `/api/v1/blog`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: your-api-key`

### API Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Post title |
| content | string | Yes | Post content (markdown) |
| author | string | No | Default: "API User" |
| categories | array | No | Default: ["Uncategorized"] |
| tags | array | No | Default: [] |
| image | string | No | Image URL or path |
| description | string | No | Meta description |
| draft | boolean | No | Default: false |
| book | string | No | Book series (creates subdirectory) |

## Automatic HTTPS Setup

### With Domain Name

1. **Point your domain** to your server IP (A record in DNS)
2. **Update [Caddyfile](Caddyfile)** with your domain
3. **Restart container**:

```bash
docker-compose restart
```

Caddy will automatically:
- Obtain SSL certificate from Let's Encrypt
- Redirect all HTTP traffic to HTTPS
- Set up auto-renewal

Your site will be accessible at:
```
https://your-domain.com
```

The API will be accessible at:
```
https://your-domain.com/api/v1/blog
```

### Without Domain (HTTP Only)

The default configuration works immediately with:
```
http://your-server-ip
```

Note: Automatic HTTPS only works with domain names, not IP addresses.

## Dynamic Content & Site Rebuilds

This deployment supports **dynamic content creation** via the API. When you create blog posts through the API:

1. The markdown file is saved to `/app/content/chinese/blog/`
2. The site **automatically rebuilds** within 2-3 seconds (via inotify file watcher)
3. The new content is immediately available on your site

### Automatic Rebuilds

The container runs a file watcher that monitors:
- `/app/content/chinese/blog/` - Blog post files
- `/app/assets/images/` - Image files

When files change, Hugo automatically rebuilds the site and updates the static files.

### Manual Rebuild

If you need to manually rebuild the site:

```bash
# Execute rebuild script inside container
docker-compose exec blog /app/scripts/rebuild.sh
```

### Persistent Storage

Blog content and images are stored in Docker volumes:
- `blog_content` - Your blog posts (markdown files)
- `blog_images` - Downloaded images

These volumes persist even if you recreate the container.

### Backup Your Content

```bash
# Backup blog content
docker run --rm -v reformed-blog_blog_content:/data -v $(pwd):/backup alpine tar -czf /backup/blog-content-backup.tar.gz /data

# Backup images
docker run --rm -v reformed-blog_blog_images:/data -v $(pwd):/backup alpine tar -czf /backup/blog-images-backup.tar.gz /data
```

### Restore Content

```bash
# Restore blog content
docker run --rm -v reformed-blog_blog_content:/data -v $(pwd):/backup alpine sh -c "cd /data && tar -xzf /backup/blog-content-backup.tar.gz --strip 1"

# Restore images
docker run --rm -v reformed-blog_blog_images:/data -v $(pwd):/backup alpine sh -c "cd /data && tar -xzf /backup/blog-images-backup.tar.gz --strip 1"

# Rebuild the site
docker-compose exec blog /app/scripts/rebuild.sh
```

## Docker Management Commands

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Stop and Start
```bash
# Stop the container
docker-compose stop

# Start the container
docker-compose start

# Restart the container
docker-compose restart

# Stop and remove containers
docker-compose down
```

### Rebuild After Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Update Content
```bash
# After modifying content, rebuild the site
docker-compose up -d --build

# View logs from both Caddy and API server
docker-compose logs -f

# View only API server logs
docker-compose logs -f | grep "API Server"
```

### Resource Monitoring
```bash
# View resource usage
docker stats reformed-blog

# View container details
docker inspect reformed-blog

# View Caddy logs
docker-compose exec blog caddy validate --config /etc/caddy/Caddyfile
docker-compose logs -f blog | grep caddy
```

## Caddy-Specific Management

### Validate Configuration
```bash
docker-compose exec blog caddy validate --config /etc/caddy/Caddyfile
```

### Reload Configuration
```bash
docker-compose exec blog caddy reload --config /etc/caddy/Caddyfile
```

### View SSL Certificates
```bash
docker-compose exec blog ls -la /data/caddy/certificates/
```

### Access Caddy Admin API (if enabled)
```bash
curl http://localhost:2019/config/
```

## Production Considerations

### 1. Custom Domain with HTTPS

Update [Caddyfile](Caddyfile):

```caddy
your-domain.com {
    root * /usr/share/caddy/html
    file_server

    encode gzip zstd

    @static {
        path *.jpg *.jpeg *.png *.gif *.ico *.css *.js *.svg *.woff *.woff2 *.ttf *.eot *.webp
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    @html {
        path *.html
    }
    header @html Cache-Control "public, max-age=0, must-revalidate"

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    try_files {path} {path}.html /404.html
}

# Redirect www to non-www
www.your-domain.com {
    redir https://your-domain.com{uri} permanent
}
```

### 2. Multiple Domains

```caddy
site1.com, site2.com {
    root * /usr/share/caddy/html
    file_server
    # ... same configuration
}
```

### 3. Automatic Updates

Create a simple update script:

```bash
#!/bin/bash
# /var/www/reformed-blog/update.sh

cd /var/www/reformed-blog
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose logs -f
```

Make it executable:
```bash
chmod +x /var/www/reformed-blog/update.sh
```

### 4. Set Up Cron Job for Automated Updates

```bash
# Edit crontab
crontab -e

# Add line to check for updates daily at 2 AM
0 2 * * * cd /var/www/reformed-blog && git pull && docker-compose up -d --build
```

### 5. Backup Strategy

```bash
#!/bin/bash
# /var/www/reformed-blog/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/reformed-blog"
SOURCE_DIR="/var/www/reformed-blog"

mkdir -p $BACKUP_DIR

# Backup content and configuration
tar -czf $BACKUP_DIR/blog_backup_$DATE.tar.gz $SOURCE_DIR/content $SOURCE_DIR/config $SOURCE_DIR/data

# Backup Caddy data (SSL certificates)
docker run --rm -v reformed-blog_caddy_data:/data -v $BACKUP_DIR:/backup alpine tar -czf /backup/caddy_backup_$DATE.tar.gz .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "blog_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "caddy_backup_*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo netstat -tlnp | grep ':80\|:443'

# Check Docker service
sudo systemctl status docker
```

### Build Fails
```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose build --no-cache
```

### Site Not Accessible
```bash
# Check container is running
docker-compose ps

# Check firewall
sudo ufw status

# Test locally
curl http://localhost

# Check Caddy status
docker-compose exec blog caddy status
```

### HTTPS/Certificate Issues
```bash
# Check DNS is pointing correctly
dig your-domain.com

# Check Caddy logs for certificate errors
docker-compose logs blog | grep -i certificate

# Validate Caddyfile syntax
docker-compose exec blog caddy validate --config /etc/caddy/Caddyfile

# Force certificate renewal
docker-compose exec blog caddy renew --config /etc/caddy/Caddyfile
```

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx     # if Nginx is running
```

## Security Recommendations

1. **Keep Docker Updated**: Regularly update Docker to the latest version
2. **Use Non-Root User**: Run Docker as a non-root user when possible
3. **Enable HTTPS**: Always use SSL/TLS in production (automatic with Caddy)
4. **Firewall Configuration**: Only allow necessary ports (80, 443)
5. **Regular Backups**: Automate backups of content and SSL certificates
6. **Monitor Logs**: Regularly check logs for suspicious activity
7. **Update Dependencies**: Regularly update Hugo and Node.js dependencies
8. **Limit Container Resources**: Add resource limits to [docker-compose.yml](docker-compose.yml)

## Resource Limits (Optional)

To prevent resource exhaustion, add to [docker-compose.yml](docker-compose.yml):

```yaml
services:
  blog:
    # ... existing configuration ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Monitoring

### Health Check Endpoint
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' reformed-blog

# Continuous monitoring
watch -n 5 'docker inspect --format="{{.State.Health.Status}}" reformed-blog'
```

### Log Monitoring
```bash
# Real-time log monitoring
docker-compose logs -f

# Log analysis
docker-compose logs --since 1h | grep -i error
```

### Performance Monitoring
```bash
# Container resource usage
docker stats reformed-blog

# Disk usage
docker system df
```

## Advanced Configuration

### HTTP/3 Enabled
Caddy supports HTTP/3 by default. To enable, add to Caddyfile:
```caddy
{
    servers {
        protocol {
            experimental_http3
        }
    }
}
```

### Basic Authentication (Optional)
Add to your site block in Caddyfile:
```caddy
basicauth {
    admin $2a$14$... # hashed password
}
```

### Rate Limiting
Caddy doesn't have built-in rate limiting, but you can use:
- Cloudflare (recommended)
- fail2ban at the OS level
- A reverse proxy with rate limiting

## Support

For issues or questions:
- Check Docker logs: `docker-compose logs -f`
- Check Caddy docs: https://caddyserver.com/docs/
- Check Hugo documentation: https://gohugo.io/
- Check Docker documentation: https://docs.docker.com/
