# DELF Grader

A website for French teachers to grade DELF Production écrite practice exams from handwritten student answers.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the architecture, [docs/TECH_STACK.md](docs/TECH_STACK.md) for the technologies used and [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for how to contribute.

## Running locally

1. Copy `.env.local.example` to `.env.local` and fill in the Convex and Clerk values.
2. Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard for the deployment.
3. Run `pnpm install`, then `pnpm dev`.
