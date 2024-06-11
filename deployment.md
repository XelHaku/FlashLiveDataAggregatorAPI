# Deployment Instructions

```bash
docker-compose build
docker-compose up

docker build -t flash-data-aggregator-api .
docker login
docker images


 docker tag flash-data-aggregator-api xelhaku/flash-data-aggregator-api:latest
docker push xelhaku/flash-data-aggregator-api:latest
docker pull xelhaku/flash-data-aggregator-api
```
