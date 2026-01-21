import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Copy, Check } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import type { ActivityLogEntry } from '../../lib/optimistic-operations'

interface ActivityItemProps {
  entry: ActivityLogEntry
}

/**
 * Single activity log entry component
 */
export function ActivityItem({ entry }: ActivityItemProps) {
  const [copied, setCopied] = useState(false)
  
  // Copy Sentry reference to clipboard
  const handleCopyRef = useCallback(async () => {
    if (entry.sentryEventId) {
      await navigator.clipboard.writeText(entry.sentryEventId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [entry.sentryEventId])
  
  // Get operation type label
  const getTypeLabel = () => {
    switch (entry.type) {
      case 'create': return 'Created'
      case 'update': return 'Updated'
      case 'delete': return 'Deleted'
      default: return 'Modified'
    }
  }
  
  // Get entity type label
  const getEntityLabel = () => {
    switch (entry.entityType) {
      case 'todo': return 'task'
      case 'subtask': return 'subtask'
      case 'list': return 'list'
      case 'ai-todo': return 'AI task'
      default: return 'item'
    }
  }
  
  // Get status icon
  const StatusIcon = () => {
    if (entry.status === 'pending') {
      if (entry.isRetrying) {
        return (
          <div className="relative">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <RefreshCw className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-600" />
          </div>
        )
      }
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    }
    if (entry.status === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-destructive" />
  }
  
  // Get status text
  const getStatusText = () => {
    if (entry.status === 'pending') {
      if (entry.isRetrying) {
        return `Retrying (${entry.retryCount}/${entry.maxRetries})...`
      }
      return 'Saving...'
    }
    if (entry.status === 'success') {
      return entry.relativeTime ? `Saved ${entry.relativeTime}` : 'Saved'
    }
    return 'Failed'
  }
  
  // Get user-friendly error message
  const getErrorMessage = () => {
    if (!entry.error) return 'Something went wrong. Please try again.'
    
    // Map common errors to friendly messages
    if (entry.error.includes('network') || entry.error.includes('fetch')) {
      return 'Network error. Please check your connection.'
    }
    if (entry.error.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    if (entry.error.includes('unauthorized') || entry.error.includes('401')) {
      return 'You need to sign in again.'
    }
    if (entry.error.includes('forbidden') || entry.error.includes('403')) {
      return 'You don\'t have permission for this action.'
    }
    if (entry.error.includes('not found') || entry.error.includes('404')) {
      return 'The item could not be found. It may have been deleted.'
    }
    
    // Truncate long error messages
    if (entry.error.length > 60) {
      return entry.error.substring(0, 57) + '...'
    }
    
    return entry.error
  }
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        entry.status === 'pending' && 'bg-muted/50',
        entry.status === 'error' && 'bg-destructive/5',
      )}
      role="listitem"
      aria-label={`${getTypeLabel()} ${getEntityLabel()}: ${entry.entityName || 'Untitled'}. Status: ${getStatusText()}`}
    >
      {/* Status Icon */}
      <div className="shrink-0 mt-0.5" aria-hidden="true">
        <StatusIcon />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Main text */}
        <p className="text-sm font-medium truncate">
          {getTypeLabel()} {getEntityLabel()}: {entry.entityName || 'Untitled'}
        </p>
        
        {/* Status text */}
        <p className={cn(
          'text-xs',
          entry.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {entry.status === 'error' ? getErrorMessage() : getStatusText()}
        </p>
        
        {/* Sentry reference for errors */}
        {entry.status === 'error' && entry.sentryEventId && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              Ref: {entry.sentryEventId.substring(0, 8)}...
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleCopyRef}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
