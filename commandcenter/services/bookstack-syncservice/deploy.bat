@echo off
echo BookStack Sync Deployment Script

REM Check if .env file exists, if not create from template
if not exist .env (
  echo Creating .env file from template...
  copy .env.template .env
  echo Please edit the .env file with your actual configuration values before continuing.
  exit /b 1
)

REM Pull the latest code if in a git repository
if exist .git (
  echo Pulling latest code...
  git pull
)

REM Build and start the containers
echo Building and starting containers...
docker-compose up -d --build

REM Wait for the application to be healthy
echo Waiting for application to start...
timeout /t 10 /nobreak > nul

REM Check if container is running
echo Checking if container is running...
docker-compose ps | findstr "bookstack-sync" | findstr "Up"
if %ERRORLEVEL% neq 0 (
  echo Container failed to start properly. Check logs with: docker-compose logs
  exit /b 1
)

REM Check application health
echo Checking application health...
curl -s http://localhost:8080/actuator/health
if %ERRORLEVEL% neq 0 (
  echo Application failed to become healthy. Check logs with: docker-compose logs
  exit /b 1
)

echo.
echo Deployment completed successfully!
echo Application is running at http://localhost:8080
echo To view logs: docker-compose logs -f 