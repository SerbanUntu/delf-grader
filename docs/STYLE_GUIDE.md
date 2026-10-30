# Writing style

- Never write any emojis or decorative non-ASCII characters. French characters are allowed. Never use semicolons when writing prose (does not apply to semicolons required for code).
- Do not write comments explaining the code. The exceptions are concise, simple to read JSDoc-style docstrings at the top level of public components, classes, or functions that are used in other parts of the codebase. Aim for a one-sentence description, separated by a one-line break before the @param, @return, and @throws clauses.
- Do not use overly technical vocabulary when simpler to understand words suffice (both in variables and when writing docstrings).
- Use continental Europe conventions for units, time and date formats, etc. The exception is decimals (required format is `0.25`). The date format is `31/12/1999`.

# Contributing

- Do not stage or commit without explicitly being told so. When committing, never add "Co-Authored-By: Claude <noreply@anthropic.com>".
- Run `just check` from a Unix-compatible shell before finishing a feature to ensure CI will pass.
- Do NOT read or commit `.env.local` in the root of the project, as it contains actual environment variables.
- When working on [Convex](https://convex.dev) code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.
- Do not write any tests (unit, integration, system, or otherwise), unless explicitly asked to do so.
  - Unit tests are in `test/unit/` and are named `*.test.ts`.
  - End-to-end tests are in `test/e2e/` and are named `*.spec.ts`.
  - Every test starts signed in as a dedicated test user, whose Clerk email address is in `E2E_CLERK_USER_EMAIL`. Use `test.use({ storageState: { cookies: [], origins: [] } })` to simulate an unauthenticated user.
  - Tests that create data must delete it when they finish, so the test user's data does not pile up.
- When you are adding a new provider and need an API key, write in the chat message that you need an API key and display all of the steps to obtain it, prefering free / cheap plans. Do not try to get an API key yourself.
