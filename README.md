# TanStack Start Todo App

This is a full‑stack Todo app built with **TypeScript**, **React**, and **TanStack Start**. It uses **Postgres** for storage, **Drizzle** for database access + migrations, and **Sentry** for error tracking and performance instrumentation.

It’s intentionally built like a “real” app: categories, subtasks, filters, validation, and an accessible UI (shadcn/ui + Radix).

---

## How to run this app (local)

### 1) Install dependencies

```bash
pnpm install
```

### 2) Create your env file

```bash
cp example.env .env.local
```

### 3) Start Postgres

You can use your own Postgres install, or run it with Docker (see below).  
Make sure `.env.local` has a working `DATABASE_URL`.

### 4) Run migrations

```bash
pnpm db:migrate
```

### 5) Start the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

---

## How to run this app (Docker)

### 1) Create your env file

```bash
cp example.env .env.local
```

Make sure you set:

- `BETTER_AUTH_SECRET` (required)
- `DATABASE_URL` should point at your machine (this will talk to the Docker Postgres container):  
  `postgres://postgres:postgres@localhost:5432/todos`

### 2) Start the app + database

```bash
docker compose up --build
```

### 3) Run migrations (first time)

In a separate terminal:

```bash
pnpm db:migrate
```

Open `http://localhost:3000`.

---

## Environment variables

This repo reads env vars from `.env.local` in dev.

- **`DATABASE_URL`** (required): Postgres connection string  
  Example: `postgres://postgres:postgres@localhost:5432/todos`
- **`BETTER_AUTH_SECRET`** (required): secret used by Better Auth
- **`BETTER_AUTH_URL`** (optional): defaults to `http://localhost:3000`
- **`VITE_SENTRY_DSN`** (optional): enables Sentry (browser + server)

---

## Scripts you’ll actually use

- **`pnpm dev`**: run the app in dev mode
- **`pnpm build`**: build for production
- **`pnpm start`**: start the production server (after build)
- **`pnpm db:migrate`**: run Drizzle migrations
- **`pnpm db:studio`**: open Drizzle Studio
- **`pnpm test`**: run tests (Vitest)
- **`pnpm lint`** / **`pnpm format`** / **`pnpm check`**: lint/format helpers

---

## Sentry (errors + instrumentation)

We use Sentry in two places:

- **Browser**: initialized in `src/router.tsx`
- **Server**: initialized in `instrument.server.mjs`

If `VITE_SENTRY_DSN` is not set, Sentry won’t run.

---

## Why I wrote this app

I built this to showcase how I like to write production‑quality software:

- **TypeScript-first**: types that flow from the database layer to the UI
- **Modern React**: clean component design, hooks, and predictable state/data flow. Complete with Optimistic updates and error handling.
- **TanStack Start patterns**: server functions + client code that stays readable as the app grows
- **Validation and correctness**: Zod validation before writing to the database
- **Maintainable structure**: separation of concerns (UI, domain types, server/data)
- **Observability**: Sentry instrumentation around server work

---

## Contact

- **Website**: `https://aaronmolina.me`
- **LinkedIn**: `https://linkedin.com/in/aaronmolinag`
- **GitHub**: `https://github.com/aaronm-git`

---
