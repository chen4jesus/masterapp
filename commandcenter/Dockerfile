# Command Center Dockerfile
# Express API + Vite React Frontend

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build the frontend
RUN npm run build

# Expose API server and preview server ports
EXPOSE 3001 5173

# Start both the API server and preview server
# Using a simple shell script approach
CMD ["sh", "-c", "node server.js & npm run preview -- --host 0.0.0.0 --port 5173"]
