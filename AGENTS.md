# Repository instructions

## Formatting

- After every change, format every updated file according to the repository's
  `.editorconfig` before continuing.
- This rule is mandatory. If the automated formatter does not support a file's
  syntax, format that file manually and verify the result.
- Before handing off work, run the relevant formatter or formatting check and
  confirm that the updated files have no formatting issues.
- The repository's IntelliJ-specific `ij_*` formatting rules are not fully
  supported by Prettier. Do not run the repository-wide Prettier write command
  on existing TypeScript files; it changes spaced array literals and expands
  empty constructors. Format affected files manually when needed and verify
  them with `git diff --check` and the relevant type checks.

## Testing

- Run `make tests` after all functional changes and before handing off the work.
- `make tests` uses the isolated `docker-compose.test.yml` stack: `api`, `web`, `runner`, and `postgres` services in the
  `test` Compose project. It does not reuse development containers or the development database. Functional tests must
  call the API over the test Compose network (`API_URL`) and use their own database connection for fixtures/assertions;
  they must not import or mount the API Express app from `server.ts`. The runner waits for both API and web
  healthchecks. Use `make test-up` and `make test-down` when manually exercising the test web Lambda at port 13000.

## Shared Lambda code

- API Lambda source files live directly under `api-lambda/src`; keep its single runtime entrypoint at `server.ts`. It
  must expose the application factory used by functional tests and the Lambda handler, while only starting a local HTTP
  server when run directly.

- Put common functions and behavior that may be used by both Lambdas in `shared`.
- For example, a shared exam-item fragment could be consumed by the web Lambda for rendering and by the API Lambda when
  returning content during subsequent lazy loads.

## Static assets

- Serve web assets and store web uploads under the repository-level `static` directory; the web Lambda exposes it at
  `/static`.

## UI styling

- Prefer Bootstrap 5 components and utility classes for presentation changes before adding custom rules to
  `static/styles.css`.

## Repository knowledge

- When work reveals useful, reusable repository knowledge, update this file with the new rule or guidance before handing
  off the work.
- Document durable conventions, build and deployment requirements, tooling limitations, and other information that will
  help future changes avoid the same issue.
- Keep refactors scoped to the layer being refactored. Do not change controllers for template-only work when the
  templates can define their own presentation data.

## Templates

- Store layout and page templates in the templates root; store reusable partial HTML templates in the `fragments`
  directory.
- Build internal links with named web-route helpers (`url(...)`, `exam_url(...)`, etc.); do not use bare fragment-only
  links such as `href="#questions"`. A fragment may be appended to a generated endpoint URL when the target is a section
  on that page.

## Web errors

- Web routes should propagate HTTP errors with their status codes; the centralized handler covers all 4xx and 5xx
  responses, returning an HTML error page for browser requests and a JSON error object when the client requests JSON.
  Unexpected errors are treated as 500 responses.
- Prefer existing project functions and already-included framework or library primitives for common behavior. Avoid
  adding dependencies for small isolated needs; introduce a new dependency only when its value justifies the added
  maintenance and runtime cost.

## Lambda and client boundaries

- The web Lambda owns GET page endpoints, including login and registration pages. All non-GET endpoints, including
  login, logout, uploads, and resource mutations, belong to the API Lambda. The web Lambda may pass the configured API
  URL to client scripts, but it must not proxy API requests.
- The API Lambda owns resource operations, mutations, authentication, uploads, and JSON/HTML responses through Express
  routes. The browser client communicates with it through AJAX calls only.
- API responses may contain rendered HTML fragments, such as updated rating markup. The client should replace the
  corresponding page fragment with that response.
- Shared HTML fragments used by both Lambdas belong in shared/templates/fragments.
- Authentication cookies and their supporting token logic must be compatible between the web and API Lambdas.
- Keep access-token extraction from Bearer headers and authentication cookies in `shared`; each Lambda owns token
  verification and user lookup.
- Keep the web Lambda dependency footprint minimal to reduce bundle size and cold-start time.
- Do not add API-only, mutation-only, or heavyweight dependencies to the web Lambda unless page rendering or
  authentication genuinely requires them; keep such dependencies in the API Lambda.
- Keep web Lambda PostgreSQL queries in web-lambda/src/repositories, organized by entity or read model.
- Shared domain entities, enums, database transformers, and model normalizers belong in `shared`; API services may
  depend on them but must not own them.
- Deploy each Lambda from its complete dist directory: the build emits Lambda code under <lambda>-lambda/dist/<lambda>
  -lambda/src and compiled shared modules under <lambda>-lambda/dist/shared; do not deploy only the Lambda source
  subtree.

## Python migration

- The application now follows the ExamMe Python/Starlette two-Lambda layout: shared modules live in `shared`, and
  Lambda-specific code stays in `api-lambda` or `web-lambda`.
- DynamoDB exam records use `EXAM#<id>` partitions; questions are stored beneath an exam as `QUESTION#<id>` sort keys.
- Questions are validated in `shared/question_dtos.py` and exposed by the API under `/exams/{exam_id}/questions`.
- Certifications represent official provider credentials; user-owned practice exams may reference a certification but
  remain separate content. Certification records use the `CERTIFICATION` partition and certification slugs as sort keys.
- Certification categories and levels, plus exam difficulties and languages, are curated choices defined in
  `shared/form_options.py`; forms render them as radio controls. Provider remains normalized text until provider-specific
  pages, filtering, or metadata justify a separate entity.
- Certification levels include `business` for provider-defined nontechnical business credentials such as AWS Certified
  AI Business Strategist; do not coerce these credentials into a technical level.
- Exams expose discovery metadata including `certification_id`, `provider` through the certification, `difficulty`, and
  `language`; categories remain curated taxonomy while tags remain flexible keywords.
- Run the Python functional suite with `make tests`; its isolated Compose stack uses DynamoDB rather than PostgreSQL.
- Run production maintenance/import commands through the `scripts-production` service in
  `docker-compose.scripts.production.yml`. These commands must default to a read-only dry run and require an explicit
  `--apply` for writes; use application services such as `save_public_file` instead of duplicating their behavior or
  calling the deployed HTTP API.
- After DynamoDB schema/index changes, run `make recreate-local-dynamodb`; the local table is persistent and cannot be
  migrated in place. Local AWS CLI commands default to `us-west-2`.
- Exam categories use `CATEGORY` partitions, category/status exam indexes, and the `published_exams_count` counter;
  legacy exams without a category are read as `other`.
- Exam descriptions are plain text, limited to 500 characters; the legacy DynamoDB `content` field is retained only as a
  migration alias. Exam and certification cover images use the explicit `image_filename` field. New exams receive a
  starter choice question so they can be tried immediately.
- Questions use `title`, `description`, and a list of choice objects (`title`, `description`, `is_correct`); do not
  reintroduce the old `Question.prompt` or string-choice shape.
- Exam sessions are stored under the user partition, with answers under the session partition. The web session page
  submits answers through API routes and records a passed/failed result in history.
