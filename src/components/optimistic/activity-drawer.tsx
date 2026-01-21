import { ClipboardList, Loader2, ChevronDown } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../ui/drawer'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { ActivityItem } from './activity-item'
import {
  useActivityDrawer,
  useActivityLog,
  useOptimisticProgress,
} from '../../lib/optimistic-operations'

/**
 * Activity drawer that shows operation history
 * 
 * - Slides down from the top when clicking the progress bar
 * - Shows pending, completed, and failed operations
 * - Most recent first
 * - Supports infinite scroll via "Load More" button
 */
export function ActivityDrawer() {
  const { isDrawerOpen, closeDrawer } = useActivityDrawer()
  const { 
    activityLog, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingActivity,
  } = useActivityLog()
  const { pendingCount } = useOptimisticProgress()
  
  // Count failed operations (only from currently loaded items)
  const failedCount = activityLog.filter(e => e.status === 'error').length
  
  return (
    <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()} direction="top">
      <DrawerContent className="max-h-[60vh]" aria-label="Activity log">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              Activity Log
            </DrawerTitle>
            <DrawerDescription>
              {pendingCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {pendingCount} operation{pendingCount !== 1 ? 's' : ''} in progress
                </span>
              )}
              {pendingCount > 0 && failedCount > 0 && ' • '}
              {failedCount > 0 && (
                <span className="text-destructive">
                  {failedCount} failed
                </span>
              )}
              {pendingCount === 0 && failedCount === 0 && activityLog.length === 0 && (
                <span>Recent activity will appear here</span>
              )}
            </DrawerDescription>
          </DrawerHeader>
          
          <ScrollArea className="h-[calc(60vh-8rem)]">
            <div className="p-4 space-y-2" role="list" aria-label="Recent operations">
              {isLoadingActivity ? (
                <LoadingState />
              ) : activityLog.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {activityLog.map((entry) => (
                    <ActivityItem key={entry.id} entry={entry} />
                  ))}
                  
                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center pt-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="gap-2"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Load More
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasNextPage && activityLog.length > 0 && (
                    <div className="flex justify-center pt-4 pb-2">
                      <p className="text-xs text-muted-foreground">
                        — End of activity log —
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
          
          {/* Bottom handle for top drawer */}
          <div className="flex justify-center py-2 border-t">
            <div className="w-12 h-1.5 rounded-full bg-muted" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * Loading state when fetching initial activity
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Loading activity...</p>
    </div>
  )
}

/**
 * Empty state when no activity
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No recent activity</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Changes you make will appear here so you can track their progress.
      </p>
    </div>
  )
}
