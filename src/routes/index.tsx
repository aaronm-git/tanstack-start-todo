import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Zap,
  Server,
  Route as RouteIcon,
  Shield,
  Waves,
  Sparkles,
} from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: session } = useSession()

  const features = [
    {
      icon: <Zap className="h-10 w-10" />,
      title: 'Powerful Server Functions',
      description:
        'Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.',
    },
    {
      icon: <Server className="h-10 w-10" />,
      title: 'Flexible Server Side Rendering',
      description:
        'Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.',
    },
    {
      icon: <RouteIcon className="h-10 w-10" />,
      title: 'API Routes',
      description:
        'Build type-safe API endpoints alongside your application. No separate backend needed.',
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: 'Strongly Typed Everything',
      description:
        'End-to-end type safety from server to client. Catch errors before they reach production.',
    },
    {
      icon: <Waves className="h-10 w-10" />,
      title: 'Full Streaming Support',
      description:
        'Stream data from server to client progressively. Perfect for AI applications and real-time updates.',
    },
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: 'Next Generation Ready',
      description:
        'Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Welcome to Your Application
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Full-stack application with server functions, streaming, and
                type safety. Built for modern web development.
              </p>
            </div>
            <div className="space-x-4">
              {session?.user ? (
                <div className="flex flex-col items-center gap-4">
                  <Button asChild size="lg">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {session.user.name || session.user.email}!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Button asChild size="lg">
                    <Link to="/login">Sign In / Sign Up</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This is a public route. Try the{' '}
                    <Link
                      to="/dashboard"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      protected dashboard
                    </Link>{' '}
                    after signing in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
