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
    return Sentry.startSpan({ name: 'createActivityLog' }, async () => {
      const { operationType, entityType, entityId, entityName, maxRetries, userId, startedAt } = ctx.data
      
      const insertValues: Record<string, unknown> = {
        operationType,
        entityType,
        entityId: entityId || null,
        entityName,
        status: 'pending',
        maxRetries: String(maxRetries),
        userId: userId || null,
      }
      
      // Use provided startedAt if available, otherwise let DB default to now()
      if (startedAt) {
        insertValues.startedAt = startedAt
      }
      
      const [result] = await db.insert(activityLogs).values(insertValues).returning()
      
      return {
        ...result,
        retryCount: Number(result.retryCount),
        maxRetries: Number(result.maxRetries),
      } as ActivityLogRecord
    })
  })

/**
 * Update an existing activity log entry
 * Called when an operation completes (success or error)
 */
export const updateActivityLog = createServerFn({ method: 'POST' })
  .inputValidator(updateActivitySchema)
  .handler(async (ctx): Promise<ActivityLogRecord> => {
    return Sentry.startSpan({ name: 'updateActivityLog' }, async () => {
      const { id, status, entityId, errorMessage, sentryEventId, retryCount, completedAt } = ctx.data
      
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
        throw new Error(`Activity log entry ${id} not found`)
      }
      
      return {
        ...result,
        retryCount: Number(result.retryCount),
        maxRetries: Number(result.maxRetries),
      } as ActivityLogRecord
    })
  })

/**
 * Get activity logs with cursor-based pagination
 * Supports infinite scroll by returning a cursor for the next page
 */
export const getActivityLogs = createServerFn({ method: 'GET' })
  .inputValidator(getActivityLogsSchema)
  .handler(async (ctx): Promise<ActivityLogsPage> => {
    return Sentry.startSpan({ name: 'getActivityLogs' }, async () => {
      const { limit, cursor } = ctx.data
      
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
      const nextCursor = hasMore && items.length > 0
        ? items[items.length - 1].startedAt.toISOString()
        : null
      
      return {
        items: items.map(r => ({
          ...r,
          retryCount: Number(r.retryCount),
          maxRetries: Number(r.maxRetries),
        })) as ActivityLogRecord[],
        nextCursor,
        hasMore,
      }
    })
  })

/**
 * Delete old activity logs (for cleanup)
 * Deletes logs older than the specified number of days
 */
export const cleanupActivityLogs = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    olderThanDays: z.number().default(7),
  }))
  .handler(async (ctx): Promise<{ deleted: number }> => {
    return Sentry.startSpan({ name: 'cleanupActivityLogs' }, async () => {
      const { olderThanDays } = ctx.data
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      
      // Delete old completed logs (keep pending ones regardless of age)
      const result = await db
        .delete(activityLogs)
        .where(
          and(
            lt(activityLogs.startedAt, cutoffDate),
            // Only delete completed operations (not pending)
            eq(activityLogs.status, 'success')
          )
        )
        .returning({ id: activityLogs.id })
      
      return { deleted: result.length }
    })
  })
