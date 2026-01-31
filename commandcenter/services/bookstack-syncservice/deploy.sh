#!/bin/bash

# Exit on error
set -e

# Check if .env file exists, if not create from template
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.template .env
  echo "Please edit the .env file with your actual configuration values before continuing."
  exit 1
fi

# Pull the latest code if in a git repository
if [ -d .git ]; then
  echo "Pulling latest code..."
  git pull
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for the application to be healthy
echo "Waiting for application to start..."
attempt=1
max_attempts=10
until docker-compose ps | grep "bookstack-sync" | grep -q "Up" || [ $attempt -gt $max_attempts ]; do
  echo "Attempt $attempt/$max_attempts: Waiting for container to be up..."
  sleep 5
  ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
  echo "Container failed to start properly. Check logs with: docker-compose logs"
  exit 1
fi

# Check application health
echo "Checking application health..."
attempt=1
until curl -s http://localhost:8080/actuator/health | grep -q "UP" || [ $attempt -gt $max_attempts ]; do
  echo "Attempt $attempt/$max_attempts: Waiting for application to be healthy..."
  sleep 5
  ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
  echo "Application failed to become healthy. Check logs with: docker-compose logs"
  exit 1
fi

echo "Deployment completed successfully!"
echo "Application is running at http://localhost:8080"
echo "To view logs: docker-compose logs -f" 