/**
 * Centralized Sentry Logging Utility
 *
 * Provides structured logging that flows to Sentry log drain.
 * Use for business events, state transitions, and debugging context.
 *
 * Philosophy: Log what helps debug production issues, not implementation details.
 *
 * @example
 * // Business event
 * serverLog.info('todo.create.success', { todoId: '123', priority: 'high' })
 *
 * // Warning for slow operation
 * serverLog.warn('db.query.slow', { operation: 'getTodos', durationMs: 1500 })
 *
 * // Error context (pair with Sentry.captureException)
 * serverLog.error('todo.create.failed', { reason: 'validation', field: 'name' })
 */

import * as Sentry from '@sentry/tanstackstart-react'

/**
 * Context types for structured logging
 */
type LogContext = Record<string, string | number | boolean | null | undefined>

/**
 * Sanitize context values to prevent PII leakage
 */
function sanitizeContext(context?: LogContext): LogContext {
  if (!context) return {}

  const sanitized: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    // Redact potentially sensitive fields
    const lowerKey = key.toLowerCase()
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('email') ||
      lowerKey.includes('ssn') ||
      lowerKey.includes('creditcard')
    ) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'string' && value.length > 200) {
      // Truncate long strings
      sanitized[key] = value.substring(0, 200) + '...[truncated]'
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Server-side structured logging utility
 *
 * All logs flow to Sentry log drain via consoleLoggingIntegration.
 * Use semantic event names following the pattern: entity.action.result
 *
 * Examples:
 * - todo.create.success
 * - ai.generation.started
 * - db.query.slow
 * - auth.session.validated
 */
export const serverLog = {
  /**
   * INFO: Track successful business events and state transitions
   *
   * Use for:
   * - Successful CRUD operations
   * - Business events (user actions, feature usage)
   * - External service calls
   */
  info: (event: string, context?: LogContext) => {
    Sentry.logger.info(event, sanitizeContext(context))
  },

  /**
   * WARN: Track recoverable issues and performance concerns
   *
   * Use for:
   * - Slow operations (>500ms threshold)
   * - Validation failures (user input errors)
   * - Retry attempts
   * - Missing optional data
   */
  warn: (event: string, context?: LogContext) => {
    Sentry.logger.warn(event, sanitizeContext(context))
  },

  /**
   * ERROR: Track operation failures (pair with Sentry.captureException)
   *
   * Use for:
   * - Database failures
   * - External API failures
   * - Unexpected errors
   * - Business logic violations
   */
  error: (event: string, context?: LogContext) => {
    Sentry.logger.error(event, sanitizeContext(context))
  },

  /**
   * DEBUG: Detailed debugging info (use sparingly in production)
   *
   * Use for:
   * - Temporary debugging during incident investigation
   * - Complex flow tracing
   */
  debug: (event: string, context?: LogContext) => {
    Sentry.logger.debug(event, sanitizeContext(context))
  },
}

/**
 * Performance threshold constants (in milliseconds)
 */
export const PERF_THRESHOLDS = {
  /** Threshold for warning about slow database queries */
  DB_QUERY_SLOW: 500,
  /** Threshold for warning about slow external API calls */
  EXTERNAL_API_SLOW: 2000,
  /** Threshold for warning about slow AI operations */
  AI_OPERATION_SLOW: 5000,
} as const

/**
 * Helper to track operation duration and log if slow
 */
export function logIfSlow(
  event: string,
  startTime: number,
  threshold: number,
  context?: LogContext,
): void {
  const durationMs = Date.now() - startTime
  if (durationMs > threshold) {
    serverLog.warn(event, { ...context, durationMs, thresholdMs: threshold })
  }
}

/**
 * Wrap an async operation with performance tracking
 * Automatically logs slow operations
 */
export async function withPerformanceLogging<T>(
  operation: string,
  threshold: number,
  fn: () => Promise<T>,
  context?: LogContext,
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await fn()
    logIfSlow(`${operation}.slow`, startTime, threshold, context)
    return result
  } catch (error) {
    const durationMs = Date.now() - startTime
    serverLog.error(`${operation}.failed`, { ...context, durationMs })
    throw error
  }
}
