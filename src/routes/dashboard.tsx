import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSession, signOut } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    // This will be handled by the component, but we can add server-side check here if needed
    return {}
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Not authenticated</CardTitle>
            <CardDescription>
              Please sign in to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/login' })}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : session.user.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle>
                    Welcome back, {session.user.name || session.user.email}!
                  </CardTitle>
                  <CardDescription>
                    Here's what's happening with your account today.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>Active</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Your account details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm text-muted-foreground">
                    {session.user.email}
                  </span>
                </div>
                {session.user.name && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Name</span>
                      <span className="text-sm text-muted-foreground">
                        {session.user.name}
                      </span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User ID</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {session.user.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>
                Information about your current session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session ID</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {session.session?.id || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Protected Route</CardTitle>
            <CardDescription>
              This is a protected route. Only authenticated users can see this
              page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/"
              className="text-sm underline underline-offset-4 hover:text-primary"
            >
              ← Back to home
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
