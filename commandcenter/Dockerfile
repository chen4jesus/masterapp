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

# Expose production port
EXPOSE 3000

# Start the production server
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server.js"]
