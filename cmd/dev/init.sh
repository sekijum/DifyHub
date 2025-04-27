#!/bin/bash

echo "初期設定"

docker network create hentai_salon

cp ./.env.example ./.env
cp ./packages/client/.env.example ./packages/client/.env
cp ./packages/server/.env.example ./packages/server/.env
cp ./terraform/prd/terraform.tfvars.example ./terraform/prd/terraform.tfvars

docker compose build --no-cache --build-arg BUILDKIT_INLINE_CACHE=1
docker compose exec server-app go generate ./infrastructure/ent
docker compose exec server-app atlas migrate apply \
  --dir "file://./infrastructure/ent/migrate/migrations" \
  --url "mysql://hentai_salon:password@mysql:3306/hentai_salon"
docker compose exec server-app go run ./infrastructure/ent/seed/main.go

EXIT_CODE=2
docker compose down
exit $EXIT_CODE
