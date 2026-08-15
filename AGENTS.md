# Repository instructions

## Formatting

- After every change, format every updated file according to the repository's
  `.editorconfig` before continuing.
- This rule is mandatory. If the automated formatter does not support a file's
  syntax, format that file manually and verify the result.
- Before handing off work, run the relevant formatter or formatting check and
  confirm that the updated files have no formatting issues.

## Shared Lambda code

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
