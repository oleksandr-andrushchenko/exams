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

## Environment variables

- `ENV`: application environment. Available values are `development` (default), `test`, and `production`.
- `STAGE`: deployment stage. Available values are `local` (default), `development`, `staging`, and `production`.

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

## Favicons

Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate favicon assets, then place the generated files in the root `static` directory and reference them from `web-lambda/templates/layout.html`.

## TODO

- redirect to the same source page after the login
- add cloud formations & deployment scripts
- replace graphql with rest
- move api-lambda/src/server/* -> api-lambda/src/*
- move common peaces from api-labmda to lambda-shared and reuse in both lambdas, for example: getQuestion or getExam
