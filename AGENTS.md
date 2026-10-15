# Repository instructions

## Review and delivery authorization

- Leave changes unstaged and uncommitted for the user to review.
- Staging, commits (including amendments), pushes, merges, rebases, reverts, tags/releases, pull requests,
  deployments, and other publishing actions require an explicit user command for that specific action.
- Implementation requests, passing checks, and guidance about organizing commits do not authorize these actions.
  Authorization for one action does not authorize another; a commit command does not authorize a push.

## Change scope

- When committing, split unrelated work into separate commits by logical concern. Include the relevant tests and
  documentation with each change.
- Import new dependencies explicitly; do not rely on wildcard imports or accidental re-exports. Remove unused imports.
- Register new application environment settings in the central configuration in `shared/shared_utils.py` and read
  them through configuration accessors or `get_config()`. Keep direct environment reads in central configuration or
  explicit process-bootstrap code.

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
- `make tests` runs pytest in the isolated `docker-compose.test.yml` stack with `api-lambda`, `web-lambda`, `tests`,
  and `dynamodb` services and its own `app_test` table. It does not reuse development containers or the development
  database. Functional tests call the test services through `API_TEST_BASE_URL` and `WEB_TEST_BASE_URL` and use their
  own database connections for fixtures and assertions; do not import the API application to make functional requests.

## Shared Lambda code

- API Lambda source files live directly under `api-lambda/src`; keep its single runtime entrypoint at `server.ts`. It
  must expose the application factory used by functional tests and the Lambda handler, while only starting a local HTTP
  server when run directly.

- Keep common domain models, persistence primitives, validation, and behavior used by both Lambdas in `shared`.
- Before adding or keeping a helper in `shared`, search its callers in both Lambdas. Keep helpers used by only one
  Lambda in that Lambda, and keep page composition, orchestration, and presentation queries with their owner. Web-only
  helpers belong in `web-lambda/web_utils.py`; genuinely shared domain and validation code remains in `shared`.
- For example, a shared exam-item fragment could be consumed by the web Lambda for rendering and by the API Lambda when
  returning content during subsequent lazy loads.

## Static assets

- Serve web assets and store web uploads under the repository-level `static` directory; the web Lambda exposes it at
  `/static`.

## UI styling

- Do not underline non-link headings. Apply link decoration to anchors rather than the heading container.

- External HTTP(S) links must use `target="_blank"` and `rel="nofollow noopener noreferrer"`. Apply this to
  user links, certification and question references, configured social links, and social-sharing controls.

- Prefer Bootstrap 5 components and utility classes for presentation changes before adding custom rules to
  `static/styles.css`.
- Generate Bootstrap grid sizes with the Jinja `row_classes` and `col_classes` filters instead of hardcoding
  `row-cols-*` or sized `col-*` classes. Plain `row` and `col` classes may remain when no sizes are specified.
  `col_classes` includes the base `col` class; use `"def": 12` when a responsive column must stack at full width.
- Exam card grids use `row_classes` with `def: 1, sm: 2, lg: 3`; certification catalog grids use
  `def: 1, md: 2, lg: 4`. Individual exam and certification cards in detail-page sidebars remain full width.
- Bootstrap and Bootstrap Icons are loaded centrally in `web-lambda/templates/layout.html`. Exam cards live in
  `shared/templates/fragments` and are also returned by lazy-loading endpoints; keep their styles and markup consistent
  for initial page renders and appended results.
- Keep `static/scripts.js` limited to JavaScript reused across pages. Put page-specific scripts in their owning template
  and initialize them after dependencies are available, using `DOMContentLoaded` for dependencies loaded with `defer`.
- Pass the listing DTO's `limit` explicitly when including `fragments/load-more-button.html`. The scroll loader sends
  its `data-limit` value to the API, overriding the endpoint URL's limit; an empty value causes a 422 response.

## Repository knowledge

- When work reveals useful, reusable repository knowledge, update this file with the new rule or guidance before handing
  off the work.
- Document durable conventions, build and deployment requirements, tooling limitations, and other information that will
  help future changes avoid the same issue.
- Keep refactors scoped to the layer being refactored. Do not change controllers for template-only work when the
  templates can define their own presentation data.

## Templates

- Store layout and page templates in the owning Lambda's templates root; store reusable partial HTML templates in the
  `fragments` directory.
- Build internal links with named web-route helpers (`url(...)`, `exam_url(...)`, etc.); do not use bare fragment-only
  links such as `href="#questions"`. A fragment may be appended to a generated endpoint URL when the target is a section
  on that page.

## Web errors

- Login/logout return destinations must be same-origin application pages, never authentication endpoints. Validate
  both the incoming return URL/referrer and the saved `redirect_url` cookie, then clear that cookie after the callback.
  Returning to a login callback reuses a single-use authorization code and causes a repeated Cognito `invalid_grant`.
  Authentication responses use `Cache-Control: no-store`.
- Admin-managed redirects are saved from Utils through API `POST /redirects` with `UPSERT_REDIRECT` permission.
  Records use `REDIRECT#<path>` / `META`. The web 404 handler resolves GET/HEAD page paths with a permanent 308,
  preserving query parameters; existing pages and file paths are not overridden. Destinations must be root-relative.
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
- Certification `duration_minutes` and `question_count` describe the official exam. Practice-exam `duration_minutes`
  is an optional suggested time, not an enforced session deadline; actual exam question counts remain derived.
- Question `reference_urls` are optional HTTP(S) review links. Keep them out of learner API projections and in-progress
  sessions; show them to authors and in finalized session reviews.
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
- Practice exams may have an optional `exam_code` for the provider exam version (for example, `SAA-C03`). Codes are
  trimmed and uppercased on writes; blank values clear the code, and legacy exams without the field remain valid.
- A linked certification is authoritative for an exam's category and difficulty. Exam records retain denormalized values
  for discovery indexes; unlisted certifications use `other`, and exam language defaults to English.
- Import reviewed JSON bundles with `scripts/load_exam_bundle.py BUNDLE --owner-id ID`; add `--approve-by ID` to
  publish only after question verification, and `--apply` to write. Reruns require an identical bundle and owner;
  imported exams carry a source fingerprint. Run only one importer for a bundle at a time.
- Run production maintenance/import commands through the `scripts-production` service in
  `docker-compose.scripts.production.yml`. These commands must default to a read-only dry run and require an explicit
  `--apply` for writes; call application services rather than the deployed HTTP API.
- The production scripts service loads `.env.prod` and runs `scripts/production_bootstrap.py` before the requested
  command. The bootstrap defaults `AWS_PROFILE` to `AWS_PROJECT` and resolves `DYNAMODB_TABLE` from `AWS_STACK`'s
  `DynamoDbTableName` output unless explicitly configured. Run commands directly through `scripts-production`;
  no extra environment flags are needed. Keep these process-bootstrap environment reads out of application modules.
- After DynamoDB schema/index changes, run `make recreate-local-dynamodb`; the local table is persistent and cannot be
  migrated in place. Local AWS CLI commands default to `us-west-2`.
- Exams maintain a transactional `questions_count` counter. Query exam questions with the `EXAM#<id>` partition and
  `QUESTION#` sort-key prefix, following DynamoDB pagination. Global lists use `QUESTIONS#<status>` partitions; direct ID
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
- Exam pages show the total question count and links to questions visible to the current user.
- Questions have independent `published`, `unpublished`, and `rejected` statuses. New and edited questions are
  unpublished. Publishing an exam publishes all its questions; unpublishing/rejecting an exam also updates its questions.
  Repeating publication on an already-published exam publishes newly added questions without repeating exam counters
  or publication notifications. Question publication uses bounded transactions and a short-lived synchronization guard.
- Public question discovery uses one key query per page against `QUESTIONS#published`, with no exam joins, scans, or
  post-query status filtering. Question index records omit answers and references and carry an exam-title snapshot.
  Cursors are status-specific; unpublished/rejected global feeds require `READ_NON_PUBLISHED_QUESTION`.
  Individual question pages still check both question and parent-exam access, and session snapshots remain readable.
- Backfill legacy question statuses and discovery records with `scripts/backfill_question_statuses.py --user-id ID`
  through the scripts service as part of rollout. It defaults to dry-run and requires `--apply` to write.
  Legacy questions inherit parent publication status; explicitly unpublished questions remain unpublished. This uses
  existing table keys and requires no new DynamoDB GSI or CloudFormation table change. Keep legacy list records during
  rollout; use `--remove-legacy` only after the previous application version is retired.

## Maintenance and import scripts

- Reuse application services and persistence helpers so imports preserve validation, counters, side effects, and domain
  invariants. Search for an existing operation before adding direct DynamoDB, S3, or filesystem writes. Keep direct
  writes limited to explicitly scoped migrations, repairs, or import metadata that existing services cannot express.
  Use `create_exam`/`update_exam` and `create_question` for content writes and `save_public_file` for public files.
- For bulk jobs with independent source items, process one item through planning, application, and result reporting
  before advancing. Make reruns skip completed items and resume interrupted work. Preserve complete-bundle validation
  and post-import question verification for reviewed exam bundles; never publish a partially imported exam.
- Isolate independent item failures, report structured errors with source identity, exception type, and reason, and leave
  failed items retryable. Include parsing, media preparation, DTO validation, and application writes in the item-level
  error boundary. Continue other items, report success/skip/error totals, and exit nonzero if any failed. Stop
  immediately for invalid run configuration, authentication, permission, policy, exhausted quota, or sustained rate limits.
- Check stable source IDs and completion state before expensive detail requests, media processing, or model calls.
  Reuse persisted import fingerprints where available. Store any filesystem checkpoints in ignored, host-mounted
  `scripts/importer/` or `.tmp/` paths so they survive container recreation. Mark completion only during `--apply`, after
  successful writes or intentional terminal skips; dry runs must not mark items complete.
  Use the same canonical source identifier for live imports and backfills from persisted URLs. Backfill completion state
  incrementally through application helpers, defaulting to dry-run.
- Use stdout for structured dry-run review: print one record per item with the complete source item under `input` and
  complete DTO/service arguments, intended create/resume/unchanged/skip action, and publication intent under `output`.
  Do not emit separate candidate and outcome records for the same dry-run item or create review manifests unless requested.
- Persist only source metadata needed for provenance, attribution, rerun matching, or application behavior. Keep raw
  source records, volatile engagement data, and operational media details in review output rather than domain records.
- Track reusable importer code in Git; keep exports, overrides, downloaded media, caches, checkpoints, and generated
  state ignored. Keep reusable application code and committed guidance source-neutral.
- For integrations with external source providers, use their official APIs and respect permissions, terms, pagination,
  quotas, and rate-limit headers, including `Retry-After`. Use conservative concurrency and bounded exponential backoff
  with jitter only for retryable failures; rely on resumability rather than aggressive retries. Do not bypass access
  restrictions through scraping, client spoofing, or credential/proxy rotation.
- When import jobs use publication-time windows, make `--since` inclusive and `--until` exclusive, and enforce source
  timestamps locally so adjacent runs do not duplicate boundary items. Successful-item limits exclude skipped or failed
  items.
- When adding LLM-backed importers, keep deterministic filtering, deduplication, ordering, field parsing, media handling,
  defaults, DTO validation, persistence, and rerun handling in code. Send only source text and the minimal context needed
  for semantic decisions; omit raw API envelopes and fields the script can compute.
- Prefer one structured LLM call per viable source item that returns either a skip decision or the complete semantic
  result. Reuse it throughout the item, and avoid model calls for completed or deterministically rejected items.

## Shared platform updates

- Lambda ZIP dependency installs use a 120-second pip socket timeout and five connection retries to tolerate slow
  package downloads. A PyPI read timeout during packaging is a build failure; retry the build after connectivity recovers.
- Template request state belongs in `template_request` (a `ContextVar`), never in cached Jinja environment globals.
  Web error handlers pass their request explicitly because exception handling may occur after middleware resets context.
- Global exam feeds validate cursors with `ExamListingQueryDTO`; user profile feeds retain `ExamQueryDTO` because their
  DynamoDB index keys differ. Reset the cursor when changing listing filters, and keep pagination links crawlable.
- Related-exam feeds use shared `related_exam_utils` and `RelatedExamQueryDTO`: merge single-tag partitions by
  creation time, deduplicate exam IDs, exclude the current exam, and return only published matches. Cursors are scoped
  to the source exam. Autoload uses the API fragment endpoint; crawlable exam-page links use `related_offset`.
- Initialize Masonry through `data-masonry-options`, not the library's `data-masonry` auto-initialization. Shared client
  code observes card sizes and media events to relayout both initial and dynamically appended cards.
- Uploaded images accept JPEG, PNG, GIF, WebP, and AVIF. Pillow 11.3 or newer supplies AVIF support; AVIF uploads generate
  responsive WebP variants through the image Lambda and its S3 event rule.
- Search engine submissions are optional and configured centrally. IndexNow handles newly published exam URLs; sitemap
  submissions use configured Google, Bing, and Yandex APIs. Google service account JSON belongs in the retained Secrets
  Manager secret created by CloudFormation, never in tracked files. Keep the web Lambda free of Google auth dependencies.
- Sitemaps paginate all catalog records, escape XML through ElementTree, and split at protocol size/count limits.
  Include questions only beneath published exams, using the same slug URLs as exam pages with an ID URL fallback.
