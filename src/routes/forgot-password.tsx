import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { requestPasswordReset } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { ArrowLeftIcon } from 'lucide-react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we’ll generate a reset link. In dev, check your
            server logs for the URL.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {sent ? (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              If an account exists for that email, a reset link has been
              generated. Check your email for the reset link.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="m@example.com"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Please wait...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link
            to="/login"
            className="text-sm underline underline-offset-4 hover:text-primary flex items-center"
          >
            <ArrowLeftIcon className="size-4 mr-1" /> Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

