# Load .env into Makefile environment
include .env
export

# Detect docker compose command
ifeq (, $(shell command -v docker-compose 2>/dev/null))
    ifeq (, $(shell command -v docker 2>/dev/null))
        $(error "Docker is not installed")
    endif
    DC := docker compose
else
    DC := docker-compose
endif

GRAPHQL_SERVICE = graphql
SSR_SERVICE = ssr
DB_SERVICE = postgres

.PHONY: help
help: ## Show this help
	@echo "Available commands:"
	@awk -F '## ' '/^[a-zA-Z0-9_-]+:.*##/ { \
		split($$1, a, ":"); \
		printf "  \033[36m%-20s\033[0m %s\n", a[1], $$2 \
	}' $(MAKEFILE_LIST) | sort

.PHONY: up
up: ## Start local Docker containers
	$(DC) up -d --remove-orphans

.PHONY: down
down: ## Stop local Docker containers
	$(DC) down

.PHONY: restart
restart: down up ## Restart local Docker containers

.PHONY: rebuild
rebuild: ## Rebuild and start Docker containers
	$(DC) up -d --build --force-recreate

.PHONY: graphql
graphql: ## Open shell in GraphQL Docker container
	$(DC) exec $(GRAPHQL_SERVICE) bash

.PHONY: ssr
ssr: ## Open shell in SSR Docker container
	$(DC) exec $(SSR_SERVICE) bash

.PHONY: db
db: ## Open PostgreSQL client for the local database
	$(DC) exec $(DB_SERVICE) psql -U postgres -d examme

.PHONY: tests
tests: ## Run GraphQL functional tests
	@POSTGRES_PORT=$${POSTGRES_PORT:-5432} $(DC) exec -e NODE_ENV=test -e NODE_OPTIONS=--no-deprecation $(GRAPHQL_SERVICE) npm run --silent test:functional
	@$(DC) exec -e NODE_ENV=test -e NODE_OPTIONS=--no-deprecation $(GRAPHQL_SERVICE) npm run --silent seed:test
.PHONY: seed
seed: ## Rebuild readable local demo data
	@$(DC) exec -e NODE_ENV=test -e NODE_OPTIONS=--no-deprecation $(GRAPHQL_SERVICE) npm run --silent seed:test


.PHONY: logs
logs: ## Tail Docker containers logs
	$(DC) logs -f

.PHONY: open
open: ## Show local site URL
	@echo "🌐 Visit http://localhost:$(FE_PORT) (SSR) in your browser manually."
