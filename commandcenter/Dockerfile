# Command Center Dockerfile
# Express API + Vite React Frontend

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install system dependencies
RUN apk add --no-cache git curl unzip

# Install Terraform manually (package removed from Alpine repos due to license change)
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.9.3/terraform_1.9.3_linux_amd64.zip -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform.zip

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
