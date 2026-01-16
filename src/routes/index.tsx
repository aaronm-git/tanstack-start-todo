import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  FolderKanban,
  Target,
  Flame,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { useTheme } from '../components/theme-provider'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getTodoStats } from '../lib/server/todos'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { data: stats } = useSuspenseQuery({
    queryKey: ['todo-stats'],
    queryFn: () => getTodoStats(),
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with Theme Toggle */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            <span className="font-semibold">Todo App</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === 'light' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === 'dark' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === 'system' && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-linear-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-2">
                <Flame className="mr-1 h-3 w-3" />
                Your Productivity Hub
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Master Your Tasks,
                <br />
                <span className="text-primary">Achieve Your Goals</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A powerful todo management system designed to help you stay organized, 
                track progress, and accomplish more every day.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4">
              {session?.user ? (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {session.user.name || session.user.email}!
                  </p>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/login">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Sign in to start organizing your tasks
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 md:py-16 border-b">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
              App Activity Overview
            </h2>
            <p className="text-muted-foreground">
              Real-time statistics from your productivity journey
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingTasks} pending
                </p>
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completionRate}% completion rate
                </p>
              </CardContent>
            </Card>

            {/* Recently Completed */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentlyCompleted}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed last 7 days
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active categories
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Due Tasks & Priority Stats */}
      <section className="w-full py-12 md:py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Due Soon Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>
                  Tasks that need your attention soon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Overdue</span>
                  </div>
                  <Badge variant={stats.overdueTasks > 0 ? 'destructive' : 'secondary'}>
                    {stats.overdueTasks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Due Today</span>
                  </div>
                  <Badge variant={stats.tasksDueToday > 0 ? 'default' : 'secondary'}>
                    {stats.tasksDueToday}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Due Tomorrow</span>
                  </div>
                  <Badge variant="secondary">{stats.tasksDueTomorrow}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Due This Week</span>
                  </div>
                  <Badge variant="outline">{stats.tasksDueThisWeek}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Priority Distribution
                </CardTitle>
                <CardDescription>
                  Tasks organized by priority level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <Badge variant="outline">{stats.priorityStats.critical}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Urgent</span>
                  </div>
                  <Badge variant="outline">{stats.priorityStats.urgent}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <Badge variant="outline">{stats.priorityStats.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                  <Badge variant="outline">{stats.priorityStats.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Low</span>
                  </div>
                  <Badge variant="outline">{stats.priorityStats.low}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
              Everything You Need
            </h2>
            <p className="text-muted-foreground">
              Powerful features to boost your productivity
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <Target className="h-8 w-8" />
                </div>
                <CardTitle>Priority Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Set priorities from low to critical. Focus on what matters most with 
                  clear visual indicators and smart sorting.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <FolderKanban className="h-8 w-8" />
                </div>
                <CardTitle>Categories & Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize tasks with custom categories. Color-coded labels make it 
                  easy to find and filter related tasks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <ListTodo className="h-8 w-8" />
                </div>
                <CardTitle>Subtasks</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Break down complex projects into manageable steps. Create nested 
                  hierarchies for better organization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <Calendar className="h-8 w-8" />
                </div>
                <CardTitle>Due Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Never miss a deadline. Set due dates, get visual reminders, and see 
                  upcoming tasks at a glance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="mb-2 text-primary">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your productivity with completion rates, trends, and 
                  real-time statistics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
                <CardHeader>
                <div className="mb-2 text-primary">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle>Instant Updates</CardTitle>
                </CardHeader>
                <CardContent>
                <CardDescription>
                  Optimistic UI gives instant feedback. Changes sync seamlessly in 
                  the background.
                </CardDescription>
                </CardContent>
              </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session?.user && (
        <section className="w-full py-12 md:py-16 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Ready to Get Organized?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-lg">
                Join now and start managing your tasks more effectively. It's free to get started!
              </p>
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link to="/login">
                  Sign Up Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
