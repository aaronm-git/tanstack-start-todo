/**
 * Activity Log Server Functions
 *
 * Handles CRUD operations for persisting activity logs to the database.
 * These functions are used by the optimistic operations context to
 * maintain a persistent activity history.
 *
 * Uses cursor-based pagination for efficient infinite scroll.
 */

import { createServerFn } from '@tanstack/react-start'
import { db } from '../../db'
import { activityLogs } from '../../db/schema'
import { eq, desc, lt, and } from 'drizzle-orm'
import { z } from 'zod'
import * as Sentry from '@sentry/tanstackstart-react'

import { serverLog, PERF_THRESHOLDS, logIfSlow } from './logging'

// Input schemas
const createActivitySchema = z.object({
  operationType: z.enum(['create', 'update', 'delete']),
  entityType: z.enum(['todo', 'subtask', 'list', 'ai-todo']),
  entityId: z.string().nullable().optional(),
  entityName: z.string(),
  maxRetries: z.number().default(3),
  userId: z.string().nullable().optional(),
  startedAt: z.date().optional(), // Optional timestamp to ensure consistency with entity updates
})

const updateActivitySchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'success', 'error']),
  entityId: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  sentryEventId: z.string().nullable().optional(),
  retryCount: z.number().optional(),
  completedAt: z.date().optional(),
})

// Cursor-based pagination schema
const getActivityLogsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(), // ISO date string of last item's startedAt
  userId: z.string().nullable().optional(),
})

// Type exports
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type GetActivityLogsInput = z.infer<typeof getActivityLogsSchema>

export interface ActivityLogRecord {
  id: string
  operationType: 'create' | 'update' | 'delete'
  entityType: 'todo' | 'subtask' | 'list' | 'ai-todo'
  entityId: string | null
  entityName: string
  status: 'pending' | 'success' | 'error'
  errorMessage: string | null
  sentryEventId: string | null
  retryCount: number
  maxRetries: number
  startedAt: Date
  completedAt: Date | null
  userId: string | null
}

export interface ActivityLogsPage {
  items: ActivityLogRecord[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Create a new activity log entry
 * Called when an operation starts
 */
export const createActivityLog = createServerFn({ method: 'POST' })
  .inputValidator(createActivitySchema)
  .handler(async (ctx): Promise<ActivityLogRecord> => {
    return Sentry.startSpan({ name: 'createActivityLog', op: 'db.insert' }, async () => {
      const startTime = Date.now()
      const {
        operationType,
        entityType,
        entityId,
        entityName,
        maxRetries,
        userId,
        startedAt,
      } = ctx.data

      try {
        const insertValues = {
          operationType,
          entityType,
          entityId: entityId || null,
          entityName,
          status: 'pending' as const,
          maxRetries: String(maxRetries),
          userId: userId || null,
          ...(startedAt ? { startedAt } : {}),
        }

        const [result] = await db.insert(activityLogs).values(insertValues).returning()

        const durationMs = Date.now() - startTime
        serverLog.info('activity.log.created', {
          activityId: result.id,
          operationType,
          entityType,
          hasEntityId: !!entityId,
          durationMs,
        })

        logIfSlow('db.activityLogs.insert', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          activityId: result.id,
        })

        return {
          ...result,
          retryCount: Number(result.retryCount),
          maxRetries: Number(result.maxRetries),
        } as ActivityLogRecord
      } catch (error) {
        serverLog.error('activity.log.create.failed', {
          operationType,
          entityType,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'activity', operation: 'createActivityLog' },
          extra: { operationType, entityType },
        })
        throw error
      }
    })
  })

/**
 * Update an existing activity log entry
 * Called when an operation completes (success or error)
 */
export const updateActivityLog = createServerFn({ method: 'POST' })
  .inputValidator(updateActivitySchema)
  .handler(async (ctx): Promise<ActivityLogRecord> => {
    return Sentry.startSpan({ name: 'updateActivityLog', op: 'db.update' }, async () => {
      const startTime = Date.now()
      const { id, status, entityId, errorMessage, sentryEventId, retryCount, completedAt } =
        ctx.data

      try {
        const updateData: Record<string, unknown> = { status }

        if (entityId !== undefined) updateData.entityId = entityId
        if (errorMessage !== undefined) updateData.errorMessage = errorMessage
        if (sentryEventId !== undefined) updateData.sentryEventId = sentryEventId
        if (retryCount !== undefined) updateData.retryCount = String(retryCount)
        if (completedAt !== undefined) updateData.completedAt = completedAt

        // Set completedAt if status is final and not already set
        if ((status === 'success' || status === 'error') && !completedAt) {
          updateData.completedAt = new Date()
        }

        const [result] = await db
          .update(activityLogs)
          .set(updateData)
          .where(eq(activityLogs.id, id))
          .returning()

        if (!result) {
          serverLog.warn('activity.log.update.notFound', { activityId: id })
          throw new Error(`Activity log entry ${id} not found`)
        }

        const durationMs = Date.now() - startTime
        serverLog.info('activity.log.updated', {
          activityId: id,
          status,
          hasError: !!errorMessage,
          hasSentryEventId: !!sentryEventId,
          durationMs,
        })

        logIfSlow('db.activityLogs.update', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          activityId: id,
        })

        return {
          ...result,
          retryCount: Number(result.retryCount),
          maxRetries: Number(result.maxRetries),
        } as ActivityLogRecord
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('not found'))) {
          serverLog.error('activity.log.update.failed', {
            activityId: id,
            status,
            errorType: error instanceof Error ? error.name : 'Unknown',
          })
          Sentry.captureException(error, {
            tags: { component: 'activity', operation: 'updateActivityLog' },
            extra: { activityId: id, status },
          })
        }
        throw error
      }
    })
  })

/**
 * Get activity logs with cursor-based pagination
 * Supports infinite scroll by returning a cursor for the next page
 */
export const getActivityLogs = createServerFn({ method: 'GET' })
  .inputValidator(getActivityLogsSchema)
  .handler(async (ctx): Promise<ActivityLogsPage> => {
    return Sentry.startSpan({ name: 'getActivityLogs', op: 'db.query' }, async () => {
      const startTime = Date.now()
      const { limit, cursor } = ctx.data

      try {
        // Build query conditions
        const conditions = cursor
          ? lt(activityLogs.startedAt, new Date(cursor))
          : undefined

        // Fetch one extra to determine if there are more pages
        const results = await db
          .select()
          .from(activityLogs)
          .where(conditions)
          .orderBy(desc(activityLogs.startedAt))
          .limit(limit + 1)

        // Check if there are more results
        const hasMore = results.length > limit
        const items = hasMore ? results.slice(0, limit) : results

        // Get cursor for next page (startedAt of last item)
        const nextCursor =
          hasMore && items.length > 0
            ? items[items.length - 1].startedAt.toISOString()
            : null

        logIfSlow('db.activityLogs.findMany', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          limit,
          hasCursor: !!cursor,
          returnedCount: items.length,
        })

        serverLog.info('activity.logs.fetched', {
          count: items.length,
          hasMore,
          hasCursor: !!cursor,
        })

        return {
          items: items.map((r) => ({
            ...r,
            retryCount: Number(r.retryCount),
            maxRetries: Number(r.maxRetries),
          })) as ActivityLogRecord[],
          nextCursor,
          hasMore,
        }
      } catch (error) {
        serverLog.error('activity.logs.fetch.failed', {
          limit,
          hasCursor: !!cursor,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'activity', operation: 'getActivityLogs' },
          extra: { limit, hasCursor: !!cursor },
        })
        throw error
      }
    })
  })

/**
 * Delete old activity logs (for cleanup)
 * Deletes logs older than the specified number of days
 */
export const cleanupActivityLogs = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      olderThanDays: z.number().default(7),
    }),
  )
  .handler(async (ctx): Promise<{ deleted: number }> => {
    return Sentry.startSpan({ name: 'cleanupActivityLogs', op: 'db.delete' }, async () => {
      const startTime = Date.now()
      const { olderThanDays } = ctx.data

      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

        serverLog.info('activity.cleanup.started', {
          olderThanDays,
          cutoffDate: cutoffDate.toISOString(),
        })

        // Delete old completed logs (keep pending ones regardless of age)
        const result = await db
          .delete(activityLogs)
          .where(
            and(
              lt(activityLogs.startedAt, cutoffDate),
              // Only delete completed operations (not pending)
              eq(activityLogs.status, 'success'),
            ),
          )
          .returning({ id: activityLogs.id })

        const durationMs = Date.now() - startTime
        serverLog.info('activity.cleanup.completed', {
          deleted: result.length,
          olderThanDays,
          durationMs,
        })

        logIfSlow('db.activityLogs.cleanup', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          deleted: result.length,
        })

        return { deleted: result.length }
      } catch (error) {
        serverLog.error('activity.cleanup.failed', {
          olderThanDays,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'activity', operation: 'cleanupActivityLogs' },
          extra: { olderThanDays },
        })
        throw error
      }
    })
  })
