# Repository instructions

## Formatting

- After every change, format every updated file according to the repository's
  `.editorconfig` before continuing.
- This rule is mandatory. If the automated formatter does not support a file's
  syntax, format that file manually and verify the result.
- Before handing off work, run the relevant formatter or formatting check and
  confirm that the updated files have no formatting issues.

## Testing

- Run `make tests` after all functional changes and before handing off the work.
- `make tests` uses the isolated `docker-compose.test.yml` stack: `api`, `web`, `runner`, and `postgres` services in the `test` Compose project. It does not reuse development containers or the development database. Functional tests must call the API over the test Compose network (`API_URL`) and use their own database connection for fixtures/assertions; they must not import or mount the API Express app from `server.ts`. The runner waits for both API and web healthchecks. Use `make test-up` and `make test-down` when manually exercising the test web Lambda at port 13000.

## Shared Lambda code

- API Lambda source files live directly under `api-lambda/src`; keep its single runtime entrypoint at `server.ts`. It must expose the application factory used by functional tests and the Lambda handler, while only starting a local HTTP server when run directly.

- Put common functions and behavior that may be used by both Lambdas in `lambda-shared`.
- For example, a shared exam-item fragment could be consumed by the web Lambda for rendering and by the API Lambda when returning content during subsequent lazy loads.

## Static assets

- Serve web assets and store web uploads under the repository-level `static` directory; the web Lambda exposes it at `/static`.

## UI styling

- Prefer Bootstrap 5 components and utility classes for presentation changes before adding custom rules to `static/styles.css`.

## Repository knowledge

- When work reveals useful, reusable repository knowledge, update this file with the new rule or guidance before handing off the work.
- Document durable conventions, build and deployment requirements, tooling limitations, and other information that will help future changes avoid the same issue.
- Keep refactors scoped to the layer being refactored. Do not change controllers for template-only work when the templates can define their own presentation data.

## Templates

- Store layout and page templates in the templates root; store reusable partial HTML templates in the `fragments` directory.

## Web errors

- Web routes should propagate HTTP errors with their status codes; the centralized handler covers all 4xx and 5xx responses, returning an HTML error page for browser requests and a JSON error object when the client requests JSON. Unexpected errors are treated as 500 responses.
- Prefer existing project functions and already-included framework or library primitives for common behavior. Avoid adding dependencies for small isolated needs; introduce a new dependency only when its value justifies the added maintenance and runtime cost.

## Lambda and client boundaries

- The web Lambda owns GET page endpoints, including login and registration pages. All non-GET endpoints, including login, logout, uploads, and resource mutations, belong to the API Lambda. The web Lambda may pass the configured API URL to client scripts, but it must not proxy API requests.
- The API Lambda owns resource operations, mutations, authentication, uploads, and JSON/HTML responses through Express routes. The browser client communicates with it through AJAX calls only.
- API responses may contain rendered HTML fragments, such as updated rating markup. The client should replace the corresponding page fragment with that response.
- Shared HTML fragments used by both Lambdas belong in lambda-shared/templates/fragments.
- Authentication cookies and their supporting token logic must be compatible between the web and API Lambdas.
- Keep access-token extraction from Bearer headers and authentication cookies in `lambda-shared`; each Lambda owns token verification and user lookup.
- Keep the web Lambda dependency footprint minimal to reduce bundle size and cold-start time.
- Do not add API-only, mutation-only, or heavyweight dependencies to the web Lambda unless page rendering or authentication genuinely requires them; keep such dependencies in the API Lambda.
- Keep web Lambda PostgreSQL queries in web-lambda/src/repositories, organized by entity or read model.
- Shared domain entities, enums, database transformers, and model normalizers belong in `lambda-shared`; API services may depend on them but must not own them.
- Deploy each Lambda from its complete dist directory: the build emits Lambda code under <lambda>-lambda/dist/<lambda>-lambda/src and compiled shared modules under <lambda>-lambda/dist/lambda-shared; do not deploy only the Lambda source subtree.
