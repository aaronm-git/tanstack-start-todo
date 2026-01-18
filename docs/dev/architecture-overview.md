# Architecture overview

High-level overview of the app’s architecture and where to make changes.

## Tech stack

- TanStack Start (app framework)
- TanStack Router (routing)
- TanStack Query (server-state + caching)
- Tailwind CSS (styling)
- shadcn/ui (UI components)
- Drizzle ORM + PostgreSQL (data)
- Better Auth (authentication)
- Sentry (error reporting + instrumentation)
- TanStack AI + OpenAI (AI todo creation)

## Code map (starting points)

- Routes: `src/routes/`
- Router setup + Sentry init: `src/router.tsx`
- UI components: `src/components/`
- Server functions: `src/lib/server/` (TanStack Start `createServerFn`)
- Database: `src/db/` (`src/db/schema.ts` and `src/db/index.ts`)
- Auth: `src/lib/auth.ts` + `src/routes/api/auth/$.tsx`
- AI todo: `src/lib/server/ai.ts`

