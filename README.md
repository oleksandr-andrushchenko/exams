# ExamMe

Monorepo containing the ExamMe API, frontend, and local development environment.

## Repository layout

- `api/` - back-end application
- `fe/` - front-end application
- Root files - Docker Compose configuration and development commands

## Prerequisites

1. Clone this repository.
2. Copy `.env.example` to `.env` and configure it if needed.
3. Run `make up` from the repository root.

## Available commands

```
  be                   Open shell in Back-End Docker container
  down                 Stop local Docker containers
  fe                   Open shell in Front-End Docker container
  help                 Show this help
  logs                 Tail Docker containers logs
  open                 Show local site URL
  rebuild              Rebuild and start Docker containers
  restart              Restart local Docker containers
  up                   Start local Docker containers
```

## TODO

- Implement live reload for application code and all local Lambda functions in the development environment.
