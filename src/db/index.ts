import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.ts'

// Prefer Netlify DB (Neon via Netlify) when available to avoid misconfigured DATABASE_URL overrides.
const databaseUrl = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL (or NETLIFY_DATABASE_URL when using Netlify DB) environment variable is required',
  )
}

export const db = drizzle(databaseUrl, { schema })
