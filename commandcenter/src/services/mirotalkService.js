/**
 * MiroTalk Service API
 *
 * Manages on-demand MiroTalk meeting room deployments using the Linode API.
 * Provides endpoints for creating, managing, and destroying meeting rooms.
 */

import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Make an HTTPS request that ignores self-signed certificate errors
 * @param {string} urlString - The URL to fetch
 * @param {object} options - Additional request options
 * @returns {Promise<{ok: boolean, status: number, data: any, error?: string}>}
 */
const fetchWithSelfSigned = (urlString, options = {}) => {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const reqOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        rejectUnauthorized: false, // Allow self-signed certificates
        timeout: options.timeout || 15000
      };

      const req = httpModule.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const isOk = res.statusCode >= 200 && res.statusCode < 300;
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve({ ok: isOk, status: res.statusCode, data: parsed });
          } catch {
            resolve({ ok: isOk, status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`[fetchWithSelfSigned] Request error for ${urlString}: ${err.message}`);
        resolve({ ok: false, status: 0, data: null, error: err.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 0, data: null, error: 'Request timeout' });
      });
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, data: null, error: err.message });
    }
  });
};

/**
 * Poll until the MiroTalk instance is ready and responding to API requests
 * @param {string} instanceIp - The IP address of the MiroTalk instance
 * @param {string} apiKeySecret - The API key secret for authentication
 * @param {number} maxAttempts - Maximum polling attempts (default: 30, ~5 minutes)
 * @returns {Promise<{ready: boolean, error?: string}>}
 */
const waitForMiroTalkReady = async (instanceIp, apiKeySecret, maxAttempts = 30) => {
  const apiUrl = `https://${instanceIp}/api/v1/stats`;
  
  console.log(`[MiroTalk] Waiting for MiroTalk to be ready at ${instanceIp}...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`[MiroTalk] Readiness check attempt ${attempt + 1}/${maxAttempts}...`);
    
    const result = await fetchWithSelfSigned(apiUrl, {
      method: 'GET',
      headers: {
        'authorization': apiKeySecret,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (result.ok) {
      console.log(`[MiroTalk] Instance at ${instanceIp} is ready! Response:`, result.data);
      return { ready: true };
    }
    
    console.log(`[MiroTalk] Not ready yet (status: ${result.status}, error: ${result.error || 'none'}), waiting 10s...`);
    
    // Wait 10 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log(`[MiroTalk] Instance at ${instanceIp} did not become ready after ${maxAttempts} attempts`);
  return { ready: false, error: 'MiroTalk did not become ready in time' };
};

const ROOMS_STATE_FILE = path.join(__dirname, "mirotalk-rooms.json");
const CONFIG_FILE = path.join(__dirname, "mirotalk-config.json");

/**
 * Read the saved configuration from file
 */
const readSavedConfig = () => {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return {};
  }
};

/**
 * Save configuration to file
 */
const saveSavedConfig = (config) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
};

/**
 * Read the rooms state from file
 */
const readRoomsState = () => {
  if (!fs.existsSync(ROOMS_STATE_FILE)) {
    return { rooms: [] };
  }
  return JSON.parse(fs.readFileSync(ROOMS_STATE_FILE, "utf8"));
};

/**
 * Save the rooms state to file
 */
const saveRoomsState = (state) => {
  fs.writeFileSync(ROOMS_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
};

/**
 * Generate a unique room ID
 */
const generateRoomId = () => {
  return `mtk-${uuidv4().slice(0, 8)}`;
};
/**
 * Generate the startup script (StackScript) that will install MiroTalk on the Linode instance
 * Uses Nginx as a reverse proxy for HTTPS with self-signed SSL certificate
 */
const generateStartupScript = (roomId, apiKeySecret) => {
  return `#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y docker.io docker-compose nginx openssl

# Start Docker
systemctl enable docker
systemctl start docker

# Create directories
mkdir -p /opt/mirotalk
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate
echo "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout /etc/nginx/ssl/key.pem \\
  -out /etc/nginx/ssl/cert.pem \\
  -subj "/C=US/ST=State/L=City/O=MiroTalk/OU=Meeting/CN=mirotalk-${roomId}"

# Set proper permissions
chmod 600 /etc/nginx/ssl/key.pem
chmod 644 /etc/nginx/ssl/cert.pem

cd /opt/mirotalk

# Create docker-compose.yml for MiroTalk P2P (HTTP internally)
cat > docker-compose.yml << 'DOCKEREOF'
version: '3'
services:
  mirotalk:
    image: mirotalk/p2p:latest
    container_name: mirotalk
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - API_KEY_SECRET=${apiKeySecret}
DOCKEREOF

# Create Nginx config for HTTPS reverse proxy
cat > /etc/nginx/sites-available/mirotalk << 'NGINXEOF'
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

server {
    listen 80;
    listen [::]:80;
    return 301 https://$host$request_uri;
}
NGINXEOF

# Enable the site
ln -sf /etc/nginx/sites-available/mirotalk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

# Start MiroTalk
docker-compose up -d

# Wait for container to be ready
sleep 15

# Verify services are running
echo "=== Docker containers ==="
docker ps
echo "=== Nginx status ==="
systemctl status nginx --no-pager

echo "MiroTalk installation complete for room ${roomId} with HTTPS via Nginx"
`;
};

/**
 * Create a Linode instance directly via the Linode API
 * @param {object} config - Configuration for the instance
 * @returns {Promise<{success: boolean, instance?: object, error?: string}>}
 */
const createLinodeInstance = async (config) => {
  const { linodeToken, roomId, region, instanceType, apiKeySecret } = config;
  
  try {
    console.log(`[Linode API] Creating instance for room ${roomId}...`);
    
    // Generate a random root password
    const rootPassword = `Mtk${uuidv4().replace(/-/g, '').slice(0, 16)}!`;
    
    // Create the Linode instance
    const response = await fetch('https://api.linode.com/v4/linode/instances', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linodeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: `mirotalk-${roomId}`,
        region: region || 'us-east',
        type: instanceType || 'g6-nanode-1',
        image: 'linode/ubuntu24.04',
        root_pass: rootPassword,
        booted: true,
        metadata: {
          user_data: Buffer.from(generateStartupScript(roomId, apiKeySecret)).toString('base64')
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.errors?.[0]?.reason || `HTTP ${response.status}`;
      console.error(`[Linode API] Failed to create instance: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    const instance = await response.json();
    console.log(`[Linode API] Instance ${instance.id} created successfully, waiting for boot...`);
    
    return { 
      success: true, 
      instance: {
        id: instance.id,
        ip: instance.ipv4?.[0] || null,
        status: instance.status,
        label: instance.label
      }
    };
  } catch (error) {
    console.error(`[Linode API] Error creating instance:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Poll for Linode instance to be running and get its IP
 * @param {string} instanceId - The Linode instance ID
 * @param {string} linodeToken - The Linode API token
 * @param {number} maxAttempts - Maximum polling attempts
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
const waitForLinodeReady = async (instanceId, linodeToken, maxAttempts = 30) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://api.linode.com/v4/linode/instances/${instanceId}`, {
        headers: {
          'Authorization': `Bearer ${linodeToken}`
        }
      });

      if (response.ok) {
        const instance = await response.json();
        if (instance.status === 'running' && instance.ipv4?.[0]) {
          console.log(`[Linode API] Instance ${instanceId} is running with IP ${instance.ipv4[0]}`);
          return { success: true, ip: instance.ipv4[0] };
        }
        console.log(`[Linode API] Instance ${instanceId} status: ${instance.status}, waiting...`);
      }
    } catch (error) {
      console.error(`[Linode API] Error polling instance:`, error);
    }
    
    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return { success: false, error: 'Instance did not become ready in time' };
};

/**
 * Destroy a Linode instance directly via the Linode API
 * @param {string} linodeId - The Linode instance ID to destroy
 * @param {string} linodeToken - The Linode API token
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const destroyLinodeInstance = async (linodeId, linodeToken) => {
  try {
    console.log(`[Linode API] Destroying instance ${linodeId}...`);
    
    const response = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${linodeToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 204) {
      console.log(`[Linode API] Instance ${linodeId} destroyed successfully`);
      return { success: true, message: 'Instance destroyed successfully' };
    } else if (response.status === 404) {
      console.log(`[Linode API] Instance ${linodeId} not found (may already be deleted)`);
      return { success: true, message: 'Instance not found (may already be deleted)' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.errors?.[0]?.reason || `HTTP ${response.status}`;
      console.error(`[Linode API] Failed to destroy instance ${linodeId}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error(`[Linode API] Error destroying instance ${linodeId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Setup MiroTalk routes on an Express app
 */
export function setupMiroTalkRoutes(app, config = {}) {
  // Helper to get effective config
  const getConfig = () => {
    const saved = readSavedConfig();
    return {
      linodeToken: saved.linodeToken || config.linodeToken || process.env.LINODE_TOKEN,
      apiKeySecret: saved.apiKeySecret || config.apiKeySecret || process.env.MIROTALK_API_SECRET || "mirotalkp2p_default_secret",
    };
  };

  let effectiveConfig = getConfig();

  /**
   * GET /api/mirotalk/rooms
   * List all meeting rooms
   */
  app.get("/api/mirotalk/rooms", async (req, res) => {
    try {
      const state = readRoomsState();
      res.json({
        success: true,
        rooms: state.rooms,
      });
    } catch (error) {
      console.error("Error listing rooms:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/mirotalk/rooms/:roomId
   * Get details of a specific room
   */
  app.get("/api/mirotalk/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const state = readRoomsState();
      const room = state.rooms.find((r) => r.id === roomId);

      if (!room) {
        return res
          .status(404)
          .json({ success: false, error: "Room not found" });
      }

      // Get live status if room is running
      if (room.status === "running" && room.apiUrl) {
        effectiveConfig = getConfig();
        try {
          const statsUrl = `${room.apiUrl}/stats`;
          console.log(`[MiroTalk] Fetching stats from ${statsUrl}`);
          
          // Use https module directly to handle self-signed certificates
          const url = new URL(statsUrl);
          const isHttps = url.protocol === 'https:';
          
          const fetchStats = () => new Promise((resolve, reject) => {
            const httpModule = isHttps ? https : http;
            const options = {
              hostname: url.hostname,
              port: url.port || (isHttps ? 443 : 80),
              path: url.pathname,
              method: 'GET',
              headers: {
                'authorization': effectiveConfig.apiKeySecret,
                'Content-Type': 'application/json'
              },
              rejectUnauthorized: false, // Allow self-signed certificates
              timeout: 10000
            };

            const req = httpModule.request(options, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    resolve(JSON.parse(data));
                  } catch (e) {
                    reject(new Error('Invalid JSON response'));
                  }
                } else {
                  reject(new Error(`HTTP ${res.statusCode}`));
                }
              });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
              req.destroy();
              reject(new Error('Request timeout'));
            });
            req.end();
          });

          room.liveStats = await fetchStats();
          console.log(`[MiroTalk] Stats received:`, room.liveStats);
        } catch (err) {
          console.log(`[MiroTalk] Failed to fetch stats: ${err.message}`);
          room.liveStats = null;
        }
      }

      res.json({ success: true, room });
    } catch (error) {
      console.error("Error getting room:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/mirotalk/rooms
   * Create a new meeting room (provisions a Linode VPS)
   */
  app.post("/api/mirotalk/rooms", async (req, res) => {
    try {
      const {
        name,
        region = "us-east",
        instanceType = "g6-nanode-1",
        hostProtected = false,
      } = req.body;

      effectiveConfig = getConfig();
      if (!effectiveConfig.linodeToken) {
        return res.status(400).json({
          success: false,
          error:
            "Linode API token not configured. Set LINODE_TOKEN environment variable.",
        });
      }

      const roomId = generateRoomId();

      // Create room record
      const room = {
        id: roomId,
        name: name || `Meeting Room ${roomId}`,
        status: "provisioning",
        region,
        instanceType,
        createdAt: new Date().toISOString(),
        hostProtected,
        meetingUrl: null,
        apiUrl: null,
        instanceIp: null,
        instanceId: null,
      };

      // Save initial state
      const state = readRoomsState();
      state.rooms.push(room);
      saveRoomsState(state);

      // Return immediately with provisioning status
      res.status(202).json({
        success: true,
        message: "Room provisioning started",
        room,
      });

      // Continue provisioning in background using direct Linode API
      (async () => {
        try {
          // Create Linode instance directly via API
          const createResult = await createLinodeInstance({
            linodeToken: effectiveConfig.linodeToken,
            roomId,
            region,
            instanceType,
            apiKeySecret: effectiveConfig.apiKeySecret
          });

          if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create Linode instance');
          }

          const instanceId = createResult.instance.id;
          
          // Wait for instance to be running
          const readyResult = await waitForLinodeReady(instanceId, effectiveConfig.linodeToken);
          
          if (!readyResult.success) {
            throw new Error(readyResult.error || 'Instance failed to become ready');
          }

          const instanceIp = readyResult.ip;
          const meetingUrl = `https://${instanceIp}`;
          const apiUrl = `https://${instanceIp}/api/v1`;

          // Update room state to booting (instance is up, waiting for MiroTalk)
          let currentState = readRoomsState();
          let roomIndex = currentState.rooms.findIndex((r) => r.id === roomId);
          if (roomIndex !== -1) {
            currentState.rooms[roomIndex].status = "booting";
            currentState.rooms[roomIndex].instanceIp = instanceIp;
            currentState.rooms[roomIndex].instanceId = instanceId;
            currentState.rooms[roomIndex].meetingUrl = meetingUrl;
            currentState.rooms[roomIndex].apiUrl = apiUrl;
            saveRoomsState(currentState);
          }

          console.log(`[MiroTalk] Linode instance ${instanceId} is booted, waiting for MiroTalk to start...`);

          // Wait for MiroTalk to be actually ready
          const miroTalkReady = await waitForMiroTalkReady(instanceIp, effectiveConfig.apiKeySecret, 30);
          
          if (!miroTalkReady.ready) {
            throw new Error(miroTalkReady.error || 'MiroTalk did not become ready');
          }

          // Update room state to running (MiroTalk is ready)
          currentState = readRoomsState();
          roomIndex = currentState.rooms.findIndex((r) => r.id === roomId);
          if (roomIndex !== -1) {
            currentState.rooms[roomIndex].status = "running";
            currentState.rooms[roomIndex].provisionedAt = new Date().toISOString();
            saveRoomsState(currentState);
          }

          console.log(`[MiroTalk] Room ${roomId} is fully ready and running!`);
        } catch (error) {
          console.error(
            `[MiroTalk] Failed to provision room ${roomId}:`,
            error,
          );

          // Update room state to failed
          const currentState = readRoomsState();
          const roomIndex = currentState.rooms.findIndex(
            (r) => r.id === roomId,
          );
          if (roomIndex !== -1) {
            currentState.rooms[roomIndex].status = "failed";
            currentState.rooms[roomIndex].error = error.message;
            saveRoomsState(currentState);
          }
        }
      })();
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/mirotalk/rooms/:roomId
   * Destroy a meeting room (destroys the Linode VPS)
   */
  app.delete("/api/mirotalk/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const state = readRoomsState();
      const roomIndex = state.rooms.findIndex((r) => r.id === roomId);

      if (roomIndex === -1) {
        return res
          .status(404)
          .json({ success: false, error: "Room not found" });
      }

      const room = state.rooms[roomIndex];
      room.status = "destroying";
      saveRoomsState(state);

      res.status(202).json({
        success: true,
        message: "Room destruction started",
        roomId,
      });

      // Destroy in background
      (async () => {
        try {
          effectiveConfig = getConfig();
          
          if (room.instanceId) {
            console.log(`[MiroTalk] Destroying instance ${room.instanceId} for room ${roomId}...`);
            const result = await destroyLinodeInstance(room.instanceId, effectiveConfig.linodeToken);
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to destroy Linode instance');
            }
          }

          // Remove from state
          const currentState = readRoomsState();
          currentState.rooms = currentState.rooms.filter(
            (r) => r.id !== roomId,
          );
          saveRoomsState(currentState);

          console.log(`[MiroTalk] Room ${roomId} destroyed successfully`);
        } catch (error) {
          console.error(`[MiroTalk] Failed to destroy room ${roomId}:`, error);

          const currentState = readRoomsState();
          const idx = currentState.rooms.findIndex((r) => r.id === roomId);
          if (idx !== -1) {
            currentState.rooms[idx].status = "destroy_failed";
            currentState.rooms[idx].error = error.message;
            saveRoomsState(currentState);
          }
        }
      })();
    } catch (error) {
      console.error("Error destroying room:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/mirotalk/rooms/:roomId/destroy
   * Directly destroy a Linode instance using the Linode API (simpler than Terraform)
   * This allows admins to issue a 'destroy' command from the command center
   */
  app.post("/api/mirotalk/rooms/:roomId/destroy", async (req, res) => {
    try {
      const { roomId } = req.params;
      const state = readRoomsState();
      const roomIndex = state.rooms.findIndex((r) => r.id === roomId);

      if (roomIndex === -1) {
        return res
          .status(404)
          .json({ success: false, error: "Room not found" });
      }

      const room = state.rooms[roomIndex];
      
      // Check if we have the instance ID to destroy
      if (!room.instanceId) {
        return res.status(400).json({
          success: false,
          error: "Room has no associated Linode instance ID. It may not have been fully provisioned."
        });
      }

      effectiveConfig = getConfig();
      if (!effectiveConfig.linodeToken) {
        return res.status(400).json({
          success: false,
          error: "Linode API token not configured."
        });
      }

      // Update status to destroying
      room.status = "destroying";
      saveRoomsState(state);

      // Destroy the instance directly via Linode API
      const result = await destroyLinodeInstance(room.instanceId, effectiveConfig.linodeToken);

      if (result.success) {
        // Remove from state
        const currentState = readRoomsState();
        currentState.rooms = currentState.rooms.filter((r) => r.id !== roomId);
        saveRoomsState(currentState);

        console.log(`[MiroTalk] Room ${roomId} destroyed successfully via Linode API`);
        res.json({
          success: true,
          message: result.message || "Room destroyed successfully",
          roomId
        });
      } else {
        // Update status to failed
        const currentState = readRoomsState();
        const idx = currentState.rooms.findIndex((r) => r.id === roomId);
        if (idx !== -1) {
          currentState.rooms[idx].status = "destroy_failed";
          currentState.rooms[idx].error = result.error;
          saveRoomsState(currentState);
        }

        res.status(500).json({
          success: false,
          error: result.error || "Failed to destroy instance"
        });
      }
    } catch (error) {
      console.error("Error destroying room via Linode API:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/mirotalk/cleanup
   * Remove all failed rooms (and ensure their Linode instances are deleted)
   */
  app.post("/api/mirotalk/cleanup", async (req, res) => {
    try {
      const state = readRoomsState();
      effectiveConfig = getConfig();
      
      const failedRooms = state.rooms.filter(r => 
        r.status === 'failed' || r.status === 'destroy_failed'
      );
      
      if (failedRooms.length === 0) {
        return res.json({ success: true, count: 0, message: "No failed rooms to cleanup" });
      }

      console.log(`[MiroTalk] Cleaning up ${failedRooms.length} failed rooms...`);
      
      // Try to ensure Linode instances are destroyed for failed rooms if they exist
      if (effectiveConfig.linodeToken) {
        for (const room of failedRooms) {
          if (room.instanceId) {
            try {
              console.log(`[MiroTalk] Ensuring instance ${room.instanceId} is destroyed for failed room ${room.id}`);
              // We don't wait for independent failures to stop the process
              await destroyLinodeInstance(room.instanceId, effectiveConfig.linodeToken);
            } catch (err) {
              console.warn(`[MiroTalk] Warning during instance cleanup for room ${room.id}:`, err);
            }
          }
        }
      }

      // Remove from state
      const newState = readRoomsState(); // Read again to be safe
      newState.rooms = newState.rooms.filter(r => 
        r.status !== 'failed' && r.status !== 'destroy_failed'
      );
      saveRoomsState(newState);

      res.json({ 
        success: true, 
        count: failedRooms.length,
        message: `Cleaned up ${failedRooms.length} failed rooms`
      });
    } catch (error) {
      console.error("Error cleaning up rooms:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/mirotalk/webhook
   * Webhook endpoint for MiroTalk room events (e.g., when last attendee leaves)
   */
  app.post("/api/mirotalk/webhook", async (req, res) => {
    try {
      const { event, room_id } = req.body;

      console.log(
        `[MiroTalk Webhook] Received event: ${event} for room: ${room_id}`,
      );

      if (event === "room_empty") {
        // Room is empty, trigger destruction
        console.log(
          `[MiroTalk] Room ${room_id} is empty. Scheduling destruction...`,
        );

        const state = readRoomsState();
        const room = state.rooms.find((r) => r.id === room_id);

        if (room && room.status === "running") {
          // Start destruction process directly (no self-referencing HTTP call)
          effectiveConfig = getConfig();
          
          if (room.instanceId && effectiveConfig.linodeToken) {
            // Update status to destroying
            room.status = "destroying";
            saveRoomsState(state);
            
            // Destroy the Linode instance directly
            const result = await destroyLinodeInstance(room.instanceId, effectiveConfig.linodeToken);
            
            if (result.success) {
              // Remove from state
              const currentState = readRoomsState();
              currentState.rooms = currentState.rooms.filter((r) => r.id !== room_id);
              saveRoomsState(currentState);
              console.log(
                `[MiroTalk] Destruction completed for empty room ${room_id}`,
              );
            } else {
              console.error(
                `[MiroTalk] Failed to destroy empty room ${room_id}: ${result.error}`,
              );
              // Update status to failed
              const currentState = readRoomsState();
              const idx = currentState.rooms.findIndex((r) => r.id === room_id);
              if (idx !== -1) {
                currentState.rooms[idx].status = "destroy_failed";
                currentState.rooms[idx].error = result.error;
                saveRoomsState(currentState);
              }
            }
          } else {
            console.log(
              `[MiroTalk] Cannot destroy room ${room_id}: missing instanceId or linodeToken`,
            );
          }
        }
      }

      res.json({ success: true, received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/mirotalk/rooms/:roomId/stats
   * Get live statistics for a running room
   */
  app.get("/api/mirotalk/rooms/:roomId/stats", async (req, res) => {
    try {
      const { roomId } = req.params;
      const state = readRoomsState();
      const room = state.rooms.find((r) => r.id === roomId);

      if (!room) {
        return res
          .status(404)
          .json({ success: false, error: "Room not found" });
      }

      if (room.status !== "running" || !room.apiUrl) {
        return res.json({
          success: true,
          stats: null,
          message: "Room not running",
        });
      }

      effectiveConfig = getConfig();
      
      // Use the internal fetch stats logic for stats
      const statsUrl = new URL(`${room.apiUrl}/stats`);
      const isHttps = statsUrl.protocol === 'https:';
      const stats = await new Promise((resolve, reject) => {
        const httpModule = isHttps ? https : http;
        const options = {
          hostname: statsUrl.hostname,
          port: statsUrl.port || (isHttps ? 443 : 80),
          path: statsUrl.pathname,
          method: 'GET',
          headers: {
            'authorization': effectiveConfig.apiKeySecret,
            'Content-Type': 'application/json'
          },
          rejectUnauthorized: false,
          timeout: 10000
        };
        const req = httpModule.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON')); }
            } else { reject(new Error(`HTTP ${res.statusCode}`)); }
          });
        });
        req.on('error', reject);
        req.end();
      });

      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error getting room stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/mirotalk/rooms/:roomId/meetings
   * Get active meetings in a room
   */
  app.get("/api/mirotalk/rooms/:roomId/meetings", async (req, res) => {
    try {
      const { roomId } = req.params;
      const state = readRoomsState();
      const room = state.rooms.find((r) => r.id === roomId);

      if (!room) {
        return res
          .status(404)
          .json({ success: false, error: "Room not found" });
      }

      if (room.status !== "running" || !room.apiUrl) {
        return res.json({
          success: true,
          meetings: [],
          message: "Room not running",
        });
      }

      effectiveConfig = getConfig();
      
      const result = await fetchWithSelfSigned(`${room.apiUrl}/meetings`, {
        method: 'GET',
        headers: {
          'authorization': effectiveConfig.apiKeySecret,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (result.ok) {
        res.json({ success: true, meetings: result.data });
      } else {
        throw new Error(result.error || `HTTP ${result.status}`);
      }
    } catch (error) {
      console.error("Error getting room meetings:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/mirotalk/config
   * Save MiroTalk service configuration
   */
  app.post("/api/mirotalk/config", (req, res) => {
    try {
      const { linodeToken, apiKeySecret } = req.body;
      const currentSaved = readSavedConfig();
      
      const newConfig = {
        ...currentSaved,
        linodeToken: linodeToken !== undefined ? linodeToken : currentSaved.linodeToken,
        apiKeySecret: apiKeySecret !== undefined ? apiKeySecret : currentSaved.apiKeySecret,
      };

      saveSavedConfig(newConfig);
      
      // Update local effective config
      effectiveConfig = getConfig();
      
      res.json({ success: true, message: "Configuration saved" });
    } catch (error) {
      console.error("Error saving config:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  
  /**
   * GET /api/mirotalk/config
   * Get MiroTalk service configuration (excluding sensitive data)
   */
  app.get("/api/mirotalk/config", (req, res) => {
    effectiveConfig = getConfig();
    res.json({
      success: true,
      config: {
        hasLinodeToken: !!effectiveConfig.linodeToken,
        linodeToken: effectiveConfig.linodeToken || "",
        // Don't return the actual secret, just whether it's set
        hasApiKeySecret: !!effectiveConfig.apiKeySecret,
        apiKeySecret: effectiveConfig.apiKeySecret || "",
        defaultRegions: [
          { id: "us-east", name: "Newark, NJ (US East)" },
          { id: "us-west", name: "Fremont, CA (US West)" },
          { id: "us-central", name: "Dallas, TX (US Central)" },
          { id: "us-southeast", name: "Atlanta, GA (US Southeast)" },
          { id: "eu-west", name: "London, UK (EU West)" },
          { id: "eu-central", name: "Frankfurt, DE (EU Central)" },
          { id: "ap-south", name: "Singapore (AP South)" },
          { id: "ap-northeast", name: "Tokyo, JP (AP Northeast)" },
        ],
        instanceTypes: [
          {
            id: "g6-nanode-1",
            name: "Nanode 1GB",
            specs: "1 CPU, 1GB RAM",
            recommended: "Up to 10 participants",
          },
          {
            id: "g6-standard-1",
            name: "Standard 2GB",
            specs: "1 CPU, 2GB RAM",
            recommended: "Up to 25 participants",
          },
          {
            id: "g6-standard-2",
            name: "Standard 4GB",
            specs: "2 CPU, 4GB RAM",
            recommended: "Up to 50 participants",
          },
          {
            id: "g6-standard-4",
            name: "Standard 8GB",
            specs: "4 CPU, 8GB RAM",
            recommended: "Up to 100 participants",
          },
        ],
      },
    });
  });

  console.log("[MiroTalk] Routes registered");
}

export default setupMiroTalkRoutes;
