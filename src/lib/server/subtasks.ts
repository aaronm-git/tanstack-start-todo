import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { db } from '../../db'
import { subtasks } from '../../db/schema'
import { eq } from 'drizzle-orm'

import {
  createSubtaskSchema,
  updateSubtaskSchema,
  type Subtask,
} from '../tasks'

import { serverLog, PERF_THRESHOLDS, logIfSlow } from './logging'

// Get all subtasks for a specific todo
export const getSubtasksForTodo = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Subtask[]> => {
    return Sentry.startSpan({ name: 'getSubtasksForTodo', op: 'db.query' }, async () => {
      const startTime = Date.now()
      const todoId = ctx.data

      try {
        const result = await db.query.subtasks.findMany({
          where: eq(subtasks.todoId, todoId),
          orderBy: (subtasks, { asc }) => [
            asc(subtasks.orderIndex),
            asc(subtasks.createdAt),
            asc(subtasks.id),
          ],
        })

        logIfSlow('db.subtasks.findMany', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId,
          count: result.length,
        })

        serverLog.info('subtask.list.fetched', { todoId, count: result.length })
        return result as Subtask[]
      } catch (error) {
        serverLog.error('subtask.list.failed', {
          todoId,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'subtasks', operation: 'getSubtasksForTodo' },
          extra: { todoId },
        })
        throw error
      }
    })
  })

// Create a new subtask
export const createSubtask = createServerFn({ method: 'POST' })
  .inputValidator(createSubtaskSchema)
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'createSubtask', op: 'db.insert' }, async () => {
      const startTime = Date.now()
      const data = ctx.data

      try {
        serverLog.info('subtask.create.started', {
          todoId: data.todoId,
          hasOrderIndex: !!data.orderIndex,
        })

        const result = await db
          .insert(subtasks)
          .values({
            name: data.name,
            todoId: data.todoId,
            orderIndex: data.orderIndex || new Date().toISOString(),
            isComplete: false,
          })
          .returning()

        const newSubtask = result[0] as Subtask

        const durationMs = Date.now() - startTime
        serverLog.info('subtask.create.success', {
          subtaskId: newSubtask.id,
          todoId: data.todoId,
          durationMs,
        })

        logIfSlow('db.subtasks.insert', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          subtaskId: newSubtask.id,
        })

        return newSubtask
      } catch (error) {
        serverLog.error('subtask.create.failed', {
          todoId: data.todoId,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'subtasks', operation: 'createSubtask' },
          extra: { todoId: data.todoId },
        })
        throw error
      }
    })
  })

// Update a subtask
export const updateSubtask = createServerFn({ method: 'POST' })
  .inputValidator(updateSubtaskSchema)
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'updateSubtask', op: 'db.update' }, async () => {
      const startTime = Date.now()
      const { id, ...updateData } = ctx.data

      try {
        // Track what fields are being updated
        const updatedFields = Object.keys(updateData).filter(
          (key) => updateData[key as keyof typeof updateData] !== undefined,
        )

        serverLog.info('subtask.update.started', {
          subtaskId: id,
          updatedFields: updatedFields.join(','),
        })

        // Remove undefined values
        const cleanData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined),
        )

        const result = await db
          .update(subtasks)
          .set(cleanData)
          .where(eq(subtasks.id, id))
          .returning()

        const updatedSubtask = result[0] as Subtask

        const durationMs = Date.now() - startTime
        serverLog.info('subtask.update.success', {
          subtaskId: id,
          updatedFieldsCount: updatedFields.length,
          durationMs,
        })

        logIfSlow('db.subtasks.update', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          subtaskId: id,
        })

        return updatedSubtask
      } catch (error) {
        serverLog.error('subtask.update.failed', {
          subtaskId: id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'subtasks', operation: 'updateSubtask' },
          extra: { subtaskId: id },
        })
        throw error
      }
    })
  })

// Toggle subtask completion status
export const toggleSubtaskComplete = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'toggleSubtaskComplete', op: 'db.update' }, async () => {
      const id = ctx.data
      const startTime = Date.now()

      try {
        // First get the current status
        const [current] = await db
          .select({ isComplete: subtasks.isComplete })
          .from(subtasks)
          .where(eq(subtasks.id, id))

        if (!current) {
          serverLog.warn('subtask.toggle.notFound', { subtaskId: id })
          return undefined
        }

        // Toggle it
        const result = await db
          .update(subtasks)
          .set({ isComplete: !current.isComplete })
          .where(eq(subtasks.id, id))
          .returning()

        const updatedSubtask = result[0] as Subtask

        serverLog.info('subtask.status.changed', {
          subtaskId: id,
          fromComplete: current.isComplete,
          toComplete: updatedSubtask.isComplete,
        })

        logIfSlow('db.subtasks.toggle', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          subtaskId: id,
        })

        return updatedSubtask
      } catch (error) {
        serverLog.error('subtask.toggle.failed', {
          subtaskId: id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'subtasks', operation: 'toggleSubtaskComplete' },
          extra: { subtaskId: id },
        })
        throw error
      }
    })
  })

// Delete a subtask
export const deleteSubtask = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<void> => {
    return Sentry.startSpan({ name: 'deleteSubtask', op: 'db.delete' }, async () => {
      const id = ctx.data
      const startTime = Date.now()

      try {
        serverLog.info('subtask.delete.started', { subtaskId: id })

        await db.delete(subtasks).where(eq(subtasks.id, id))

        const durationMs = Date.now() - startTime
        serverLog.info('subtask.delete.success', { subtaskId: id, durationMs })

        logIfSlow('db.subtasks.delete', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          subtaskId: id,
        })
      } catch (error) {
        serverLog.error('subtask.delete.failed', {
          subtaskId: id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'subtasks', operation: 'deleteSubtask' },
          extra: { subtaskId: id },
        })
        throw error
      }
    })
  })
