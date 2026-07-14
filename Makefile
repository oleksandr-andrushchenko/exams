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

BE_SERVICE = be
FE_SERVICE = fe

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

.PHONY: be
be: ## Open shell in Back-End Docker container
	$(DC) exec $(BE_SERVICE) bash

.PHONY: fe
fe: ## Open shell in Front-End Docker container
	$(DC) exec $(FE_SERVICE) bash

.PHONY: logs
logs: ## Tail Docker containers logs
	$(DC) logs -f

.PHONY: open
open: ## Show local site URL
	@echo "🌐 Visit http://localhost:$(FE_PORT) in your browser manually."