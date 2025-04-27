generate-ent-schema:
	docker compose exec server-app go generate ./infrastructure/ent

create-migration:
	docker compose exec server-app go run -mod=mod ./cmd/migrate/main.go $(name)

apply-migrations:
	docker compose exec server-app atlas migrate apply \
	  --dir "file://./infrastructure/ent/migrate/migrations" \
	  --url "mysql://hentai_salon:password@mysql:3306/hentai_salon"

db-seed:
	docker compose exec server-app go run ./infrastructure/ent/seed/main.go
