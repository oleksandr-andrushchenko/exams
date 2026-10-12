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
- Bootstrap and Bootstrap Icons are loaded centrally in `web-lambda/templates/layout.html`. Exam cards live in
  `shared/templates/fragments` and are also returned by lazy-loading endpoints; keep their styles and markup consistent
  for initial page renders and appended results.

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
- Certification providers, categories, and levels are curated choices defined in `shared/form_options.py`; provider and
  level forms render them as radio controls.
- Certification levels include `business` for provider-defined nontechnical business credentials such as AWS Certified
  AI Business Strategist; do not coerce these credentials into a technical level.
- Exams expose discovery metadata including `certification_id`, provider through the certification, derived difficulty,
  and language; categories remain curated taxonomy while tags remain flexible keywords. New and edited exam forms do
  not expose category, difficulty, or language controls.
- A linked certification is authoritative for an exam's category and difficulty. Exam records retain denormalized values
  for discovery indexes; unlisted certifications use `other`, and exam language defaults to English.
- Run the Python functional suite with `make tests`; its isolated Compose stack uses DynamoDB rather than PostgreSQL.
- Run production maintenance/import commands through the `scripts-production` service in
  `docker-compose.scripts.production.yml`. These commands must default to a read-only dry run and require an explicit
  `--apply` for writes; use application services such as `save_public_file` instead of duplicating their behavior or
  calling the deployed HTTP API.
- After DynamoDB schema/index changes, run `make recreate-local-dynamodb`; the local table is persistent and cannot be
  migrated in place. Local AWS CLI commands default to `us-west-2`.
- Exams maintain a transactional `questions_count` counter. Query exam questions with the `EXAM#<id>` partition and
  `QUESTION#` sort-key prefix, following DynamoDB pagination. Global lists use the `QUESTIONS` partition; direct ID
  reads use the `QUESTION#<id>` / `META` locator. Do not scan or filter exam partitions to list questions.
- Exam categories use `CATEGORY` partitions, category/status exam indexes, and the `published_exams_count` counter;
  legacy exams without a category are read as `other`.
- Exam descriptions are plain text, limited to 500 characters; the legacy DynamoDB `content` field is retained only as a
  migration alias. Exam and certification cover images use the explicit `image_filename` field.
- Questions use `title` and 2–10 choice objects (`title`, `explanation`, `is_correct`); do not reintroduce
  `Question.prompt`, question descriptions, choice descriptions, `is_free`, or string-choice shapes. Question forms
  initially show two choices and add more dynamically.
- Exam sessions are stored under the user partition, with answers under the session partition. The web session page
  submits answers through API routes and records a passed/failed result in history. Each session also has an
  `EXAM_SESSION_ID#<id>` locator in the user partition; direct session reads must use it instead of querying and filtering
  the user's complete history.
- A user may have only one in-progress exam session. The `USER#<user_id>` / `ACTIVE_EXAM_SESSION` pointer enforces this
  invariant transactionally; completing the session removes the pointer. Exam pages must link to the active session
  instead of offering to create another one.
- All exams and questions are free. There are no purchase routes, access flags, or paid-access checks. Legacy stored
  flags do not restrict reading content. Keep authoring permissions, publication rules, and session ownership checks.
- Exam sessions snapshot all exam question IDs when created. Skipped questions are stored with an empty
  `choice_indices` list, and multi-answer responses are correct only when they exactly match all correct choices.
- Every newly saved question choice requires an `explanation`. In-progress sessions must not reveal correctness or
  explanations; the finalized session page shows the learner's selections, correct answers, and choice explanations.
- In-progress session pages provide a review/submit view listing every session question and its answered state. Learners
  can open any question from that list and return to review without creating another session.
- Public question API responses must omit choice correctness and explanations for learners. Owners may receive the full
  authoring representation.
- Exam pages show the total question count and links to every question.

## Shared platform updates

- Template request state belongs in `template_request` (a `ContextVar`), never in cached Jinja environment globals.
  Web error handlers pass their request explicitly because exception handling may occur after middleware resets context.
- Global exam feeds validate cursors with `ExamListingQueryDTO`; user profile feeds retain `ExamQueryDTO` because their
  DynamoDB index keys differ. Reset the cursor when changing listing filters, and keep pagination links crawlable.
- Initialize Masonry through `data-masonry-options`, not the library's `data-masonry` auto-initialization. Shared client
  code observes card sizes and media events to relayout both initial and dynamically appended cards.
- Uploaded images accept JPEG, PNG, GIF, WebP, and AVIF. Pillow 11.3 or newer supplies AVIF support; AVIF uploads generate
  responsive WebP variants through the image Lambda and its S3 event rule.
- Search engine submissions are optional and configured centrally. IndexNow handles newly published exam URLs; sitemap
  submissions use configured Google, Bing, and Yandex APIs. Google service account JSON belongs in the retained Secrets
  Manager secret created by CloudFormation, never in tracked files. Keep the web Lambda free of Google auth dependencies.
- Sitemaps paginate all catalog records, escape XML through ElementTree, and split at protocol size/count limits.
