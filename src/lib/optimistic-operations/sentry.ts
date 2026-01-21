import * as Sentry from '@sentry/tanstackstart-react'
import type { OperationType, EntityType } from './types'

/**
 * Sanitize mutation variables for Sentry to avoid logging sensitive data
 */
function sanitizeForSentry(variables: unknown): Record<string, unknown> {
  if (!variables || typeof variables !== 'object') {
    return { value: typeof variables }
  }
  
  const sanitized: Record<string, unknown> = {}
  const obj = variables as Record<string, unknown>
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip potentially sensitive fields
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('auth')
    ) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'string' && value.length > 500) {
      // Truncate very long strings
      sanitized[key] = value.substring(0, 500) + '...'
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Log a failed mutation to Sentry with rich context
 * 
 * @returns The Sentry event ID for display in the activity log
 */
export function logMutationFailureToSentry(
  error: Error,
  operationType: OperationType,
  entityType: EntityType,
  entityId: string | null,
  variables: unknown,
  retryCount: number,
  maxRetries: number,
): string {
  const eventId = Sentry.captureException(error, {
    tags: {
      'mutation.type': operationType,
      'mutation.entity': entityType,
      'mutation.retries_exhausted': 'true',
    },
    extra: {
      entityId,
      retryCount,
      maxRetries,
      variables: sanitizeForSentry(variables),
      // Include a timestamp for debugging
      failedAt: new Date().toISOString(),
    },
    // Add fingerprint for better grouping
    fingerprint: [
      'mutation-failure',
      operationType,
      entityType,
      error.message,
    ],
  })
  
  return eventId
}

/**
 * Start a Sentry span for tracking mutation performance
 */
export function startMutationSpan<T>(
  name: string,
  operationType: OperationType,
  entityType: EntityType,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'mutation',
      attributes: {
        'mutation.type': operationType,
        'mutation.entity': entityType,
      },
    },
    fn,
  )
}

/**
 * Create a user-friendly error message from an error
 */
export function getFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase()
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection')
  ) {
    return 'Network error. Please check your connection and try again.'
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The request timed out. Please try again.'
  }
  
  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('unauthenticated')
  ) {
    return 'Your session has expired. Please sign in again.'
  }
  
  // Permission errors
  if (message.includes('forbidden') || message.includes('403')) {
    return 'You don\'t have permission to perform this action.'
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return 'The item could not be found. It may have been deleted.'
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return 'The data you entered is not valid. Please check and try again.'
  }
  
  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('server')
  ) {
    return 'Something went wrong on our end. Please try again later.'
  }
  
  // Default message
  return 'Something went wrong. Please try again.'
}
