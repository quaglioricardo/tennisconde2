.PHONY: up down logs reset build dev dev-db test lint credentials

## Build and launch everything (Postgres + app) in Docker. App at http://localhost:3000
up:
	docker compose up --build -d
	@echo ""
	@echo "  🎾  Tennis Conde 2 rodando em http://localhost:$${APP_PORT:-3000}"
	@echo "      Acessos dos jogadores: make credentials"
	@echo ""

## Stop containers (keeps the database volume)
down:
	docker compose down

## Stop containers and wipe the database
reset:
	docker compose down -v

## Write credentials.txt with every seeded player's login (git-ignored)
credentials:
	npm run credentials

logs:
	docker compose logs -f app

build:
	docker compose build

## Local development with hot reload: Postgres in Docker, API + Vite on the host
dev-db:
	docker compose up -d db

dev: dev-db
	npm install
	npx concurrently -k -n api,web -c blue,green "npm run dev:server" "npm run dev"

test:
	npm test

lint:
	npm run lint
