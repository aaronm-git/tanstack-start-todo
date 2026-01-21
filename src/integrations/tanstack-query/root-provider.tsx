import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Creates a QueryClient with optimized settings for optimistic updates.
 * 
 * Retry configuration:
 * - Mutations retry up to 3 times with exponential backoff
 * - Backoff: 1s, 2s, 4s (capped at 30s)
 * - Queries retry 3 times by default
 */
export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Queries retry 3 times by default
        retry: 3,
        // Stale time of 30 seconds to reduce refetches
        staleTime: 30 * 1000,
      },
      mutations: {
        // Retry mutations up to 3 times
        retry: 3,
        // Exponential backoff: 1s, 2s, 4s (capped at 30s)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Keep mutation data in cache for 5 minutes for activity log
        gcTime: 5 * 60 * 1000,
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
