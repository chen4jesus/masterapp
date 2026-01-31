# FaithConnect Modular Deployment Guide

This system uses a **Modular Infrastructure** approach. The core (Caddy + Network) runs independently, and each application is "plugged in" as a separate service.

## 🏗️ The Architecture

1.  **Shared Network**: A global Docker network called `faithconnect`.
2.  **Core Gateway**: Caddy runs in its own container, listening on port 80/443.
3.  **App Containers**: Each app has its own `docker-compose.app.yml` and connects to the `faithconnect` network.
4.  **Graceful Upstreams**: If an app is stopped, Caddy returns a friendly "Starting or Unavailable" page instead of a generic error.

---

## 🚀 Quick Start (New System)

### 1. Initialize Infrastructure

```bash
# Start Caddy and the shared network
docker compose up -d
```

### 2. Start Applications

You can start apps individually or all at once:

```bash
# Using the management script
./manage.sh start-all

# OR manually
docker compose -f bookstack/docker-compose.app.yml up -d
docker compose -f claudable/docker-compose.app.yml up -d
# ... etc
```

---

## 🕹️ Management Script (`./manage.sh`)

I've provided a helper script to make management easy. **Make sure to run `chmod +x manage.sh` if on Linux/WSL.**

| Command                    | Description                             |
| :------------------------- | :-------------------------------------- |
| `./manage.sh infra-up`     | Start Caddy & shared network            |
| `./manage.sh start <app>`  | Start a specific app (e.g. `bookstack`) |
| `./manage.sh stop <app>`   | Stop a specific app                     |
| `./manage.sh status-all`   | See what's running across everything    |
| `./manage.sh reload-caddy` | Apply changes made to the `Caddyfile`   |

---

## 🔌 How to Add/Remove Apps (The "Plug & Play" Workflow)

### To ADD a new app (example: `myapp`):

1.  **Create folder** `myapp/` with your code.
2.  **Create `myapp/docker-compose.app.yml`**:
    ```yaml
    services:
      myapp-service:
        build: .
        container_name: myapp-container
        expose:
          - "8080" # The port your app listens on
        networks:
          - faithconnect
    networks:
      faithconnect:
        external: true
    ```
3.  **Update the master `Caddyfile`**:
    Add the new subdomain block:
    ```caddyfile
    myapp.faithconnect.us {
        import common_headers
        reverse_proxy myapp-container:8080
    }
    ```
4.  **Reload**:
    ```bash
    ./manage.sh reload-caddy
    docker compose -f myapp/docker-compose.app.yml up -d
    ```

### To REMOVE an app:

1.  Run `./manage.sh stop myapp`.
2.  (Optional) Remove its block from the `Caddyfile` and run `./manage.sh reload-caddy`.
3.  **Note**: The main host (Caddy) and other apps remain completely unaffected.

---

## 🔐 SSL & Certificates

- **Automatic**: Caddy handles Let's Encrypt for all subdomains automatically.
- **Claudable**: Requires Cloudflare Origin Certificates in the `./certs` folder:
  - `./certs/origin.pem`
  - `./certs/origin.key`

## 📂 Directory Structure

```text
.
├── Caddyfile              # Master proxy rules
├── docker-compose.yml     # Core Infrastructure (Caddy)
├── manage.sh              # Management script
├── certs/                 # Cloudflare certs
├── logs/                  # Centralized logs
├── bookstack/             # App 1
│   └── docker-compose.app.yml
├── claudable/             # App 2
│   └── docker-compose.app.yml
└── ...                    # Other apps
```
