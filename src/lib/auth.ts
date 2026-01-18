import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
// import * as Sentry from '@sentry/tanstackstart-react'
import { db } from '../db'
// import { sendEmail } from './server/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    /**
     * Dev-only password reset delivery:
     * Better Auth generates the reset URL; we log it so you can copy/paste it.
     * Replace this with a real email provider in production.
     */
    sendResetPassword: async ({ user, url }, _request) => {
      // Log the reset URL to console for development
      console.log(`[Better Auth] Password reset for ${user.email}: ${url}`)
      
      // Email sending disabled - uncomment below to re-enable
      // void Sentry.startSpan({ name: 'better-auth:sendResetPassword' }, async () => {
      //   try {
      //     await sendEmail({
      //       to: user.email,
      //       template: 'reset-password',
      //       data: {
      //         appName: 'Toodyloo',
      //         resetPasswordUrl: url,
      //       },
      //     })
      //   } catch (error) {
      //     console.error(`[Better Auth] Failed to send password reset email to ${user.email}:`, error)
      //     Sentry.captureException(error, {
      //       tags: { component: 'email', action: 'sendResetPassword' },
      //       extra: { userEmail: user.email },
      //     })
      //   }
      // }).catch((error) => {
      //   console.error(`[Better Auth] Error in email span:`, error)
      //   Sentry.captureException(error)
      // })
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [tanstackStartCookies()],
})
