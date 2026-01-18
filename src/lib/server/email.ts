import { Resend } from 'resend'
import * as Sentry from '@sentry/tanstackstart-react'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  template,
  data,
}: {
  to: string
  template: string
  data: {
    appName: string
    resetPasswordUrl: string
  }
}) {
  return await Sentry.startSpan({ name: `email:send` }, async () => {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: 'Toodyloo App - Reset your password',
      template: {
        id: template,
        variables: {
          resetPasswordUrl: data.resetPasswordUrl,
        },
      },
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return result
  })
}
