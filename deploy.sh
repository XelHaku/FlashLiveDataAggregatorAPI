#!/bin/bash

# Check Docker version
docker --version
# Check if Docker is available
if [ $? -ne 0 ]; then
  echo "Docker is not installed or not running. Exiting."
  exit 1
fi

# Uncomment the following line if you actually want to wait for 60 minutes
# echo "Waiting for 60 minutes..."
# sleep 3600

# Build the Docker image
docker build -t xelhaku/flash-data-aggregator-api:latest .

# Check if the build was successful
if [ $? -ne 0 ]; then
  echo "Docker build failed. Exiting."
  exit 1
fi

# Tag the Docker image
docker tag xelhaku/flash-data-aggregator-api:latest registry.digitalocean.com/trebuchet-container-registry/xelhaku/flash-data-aggregator-api:latest

# Push the Docker image
docker push registry.digitalocean.com/trebuchet-container-registry/xelhaku/flash-data-aggregator-api:latest

# Check if the push was successful
if [ $? -ne 0 ]; then
  echo "Docker push failed. Exiting."
  exit 1
fi

echo "Docker image built, tagged, and pushed successfully."

# # Shutdown the PC
# echo "Shutting down the PC in 1 minute..."
# sudo shutdown -h +1 "Docker tasks completed. Shutting down in 1 minute."
