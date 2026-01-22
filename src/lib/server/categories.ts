import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { db } from '../../db'
import { lists, todos } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

// Import schemas and types from single source of truth
import {
  createListSchema,
  updateListSchema,
  type ListWithCount,
} from '../tasks'

import { serverLog, PERF_THRESHOLDS, logIfSlow } from './logging'

// Helper to get todo count for a list
async function getTodoCount(listId: string): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(todos)
    .where(eq(todos.listId, listId))

  return Number(result?.count || 0)
}

// Get all lists with todo counts
export const getLists = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListWithCount[]> => {
    return Sentry.startSpan({ name: 'getLists', op: 'db.query' }, async () => {
      const startTime = Date.now()

      try {
        const allLists = await db.query.lists.findMany({
          orderBy: (lists, { asc }) => [asc(lists.name)],
        })

        const listsWithCounts = await Promise.all(
          allLists.map(async (list) => ({
            ...list,
            todoCount: await getTodoCount(list.id),
          })),
        )

        logIfSlow('db.lists.findMany', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          count: allLists.length,
        })

        serverLog.info('list.list.fetched', { count: allLists.length })
        return listsWithCounts
      } catch (error) {
        serverLog.error('list.list.failed', {
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'lists', operation: 'getLists' },
        })
        throw error
      }
    })
  },
)

// Get a single list by ID
export const getListById = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'getListById', op: 'db.query' }, async () => {
      const startTime = Date.now()

      try {
        const list = await db.query.lists.findFirst({
          where: eq(lists.id, ctx.data),
        })

        if (!list) {
          serverLog.warn('list.get.notFound', { listId: ctx.data })
          throw new Error('List not found')
        }

        const todoCount = await getTodoCount(list.id)

        logIfSlow('db.lists.findFirst', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          listId: ctx.data,
        })

        return {
          ...list,
          todoCount,
        }
      } catch (error) {
        if (!(error instanceof Error && error.message === 'List not found')) {
          serverLog.error('list.get.failed', { listId: ctx.data })
          Sentry.captureException(error, {
            tags: { component: 'lists', operation: 'getListById' },
            extra: { listId: ctx.data },
          })
        }
        throw error
      }
    })
  })

// Create a new list
export const createList = createServerFn({ method: 'POST' })
  .inputValidator(createListSchema)
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'createList', op: 'db.insert' }, async () => {
      const startTime = Date.now()

      try {
        const data = createListSchema.parse(ctx.data)

        serverLog.info('list.create.started', {
          hasColor: !!data.color,
        })

        const [newList] = await db
          .insert(lists)
          .values({
            name: data.name,
            color: data.color,
          })
          .returning()

        const durationMs = Date.now() - startTime
        serverLog.info('list.create.success', {
          listId: newList.id,
          hasColor: !!newList.color,
          durationMs,
        })

        logIfSlow('db.lists.insert', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          listId: newList.id,
        })

        return {
          ...newList,
          todoCount: 0,
        }
      } catch (error) {
        serverLog.error('list.create.failed', {
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'lists', operation: 'createList' },
        })
        throw error
      }
    })
  })

// Update a category
export const updateList = createServerFn({ method: 'POST' })
  .inputValidator(updateListSchema)
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'updateList', op: 'db.update' }, async () => {
      const startTime = Date.now()

      try {
        const data = updateListSchema.parse(ctx.data)
        const { id, ...updateData } = data

        // Track what fields are being updated
        const updatedFields = Object.keys(updateData).filter(
          (key) => updateData[key as keyof typeof updateData] !== undefined,
        )

        serverLog.info('list.update.started', {
          listId: id,
          updatedFields: updatedFields.join(','),
        })

        const [updated] = await db
          .update(lists)
          .set(updateData)
          .where(eq(lists.id, id))
          .returning()

        const todoCount = await getTodoCount(id)

        const durationMs = Date.now() - startTime
        serverLog.info('list.update.success', {
          listId: id,
          updatedFieldsCount: updatedFields.length,
          durationMs,
        })

        logIfSlow('db.lists.update', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          listId: id,
        })

        return {
          ...updated,
          todoCount,
        }
      } catch (error) {
        serverLog.error('list.update.failed', {
          listId: ctx.data?.id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'lists', operation: 'updateList' },
          extra: { listId: ctx.data?.id },
        })
        throw error
      }
    })
  })

// Delete a list (sets todos.listId to null via DB constraint)
export const deleteList = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<{ success: boolean; id: string }> => {
    return Sentry.startSpan({ name: 'deleteList', op: 'db.delete' }, async () => {
      const id = ctx.data
      const startTime = Date.now()

      try {
        // Get todo count before deleting for logging
        const todoCount = await getTodoCount(id)

        serverLog.info('list.delete.started', { listId: id, affectedTodos: todoCount })

        await db.delete(lists).where(eq(lists.id, id))

        const durationMs = Date.now() - startTime
        serverLog.info('list.delete.success', {
          listId: id,
          affectedTodos: todoCount,
          durationMs,
        })

        logIfSlow('db.lists.delete', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          listId: id,
        })

        return { success: true, id }
      } catch (error) {
        serverLog.error('list.delete.failed', {
          listId: id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'lists', operation: 'deleteList' },
          extra: { listId: id },
        })
        throw error
      }
    })
  })

// Note: Bulk assign/remove operations are no longer needed since todos have a single listId field.
// To update a todo's list, use the updateTodo function with listId.
