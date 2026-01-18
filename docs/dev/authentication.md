# Authentication (Better Auth)

This app uses [Better Auth](https://www.better-auth.com/) for email + password authentication, backed by PostgreSQL via a Drizzle adapter.

## Configuration

Environment variables (see `example.env`):

- `BETTER_AUTH_SECRET`: required. Used to sign/encrypt auth tokens.
- `BETTER_AUTH_URL`: required in deployed environments; defaults to `http://localhost:3000` locally.
- `DATABASE_URL`: required. PostgreSQL connection string.

Better Auth is mounted at:

- Base path: `/api/auth`

## Where to look in the code

- **Server auth config**: `src/lib/auth.ts`
- **Auth API route handler**: `src/routes/api/auth/$.tsx`
- **Client auth helpers/hooks**: `src/lib/auth-client.ts` (`signIn`, `signUp`, `signOut`, `useSession`, etc.)
- **Login UI**: `src/routes/login.tsx`
- **Forgot/reset password UI**: `src/routes/forgot-password.tsx`

## Password reset delivery (dev vs prod)

In development, password reset emails are **not sent**. Better Auth generates a reset URL and we log it to the server console.

If you want real password reset emails in production, wire up an email provider and instrument it (we use Sentry in this repo) where the `sendResetPassword` callback is defined in `src/lib/auth.ts`.

## User documentation

- [How to use authentication](../user/authentication.md)

