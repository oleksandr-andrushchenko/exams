# Repository instructions

## Formatting

- After every update, format each updated file according to the repository's `.editorconfig`.

## Shared Lambda code

- Put common functions and behavior that may be used by both Lambdas in `lambda-shared`.
- For example, a shared exam-item fragment could be consumed by the web Lambda for rendering and by the API Lambda when returning content during subsequent lazy loads.
