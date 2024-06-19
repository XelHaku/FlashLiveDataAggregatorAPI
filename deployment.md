# Deployment Instructions

```bash
docker-compose build
docker-compose up

docker build -t flash-data-aggregator-api .
docker login
docker images

docker run -d --env-file .env -p 3000:3000 xelhaku/arenaton:latest



docker build -t xelhaku/flash-data-aggregator-api:latest .
docker tag xelhaku/flash-data-aggregator-api:latest registry.digitalocean.com/trebuchet-container-registry/xelhaku/flash-data-aggregator-api:latest
docker push registry.digitalocean.com/trebuchet-container-registry/xelhaku/flash-data-aggregator-api:latest
```
