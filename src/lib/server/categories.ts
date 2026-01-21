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
    return Sentry.startSpan({ name: 'getLists' }, async () => {
      const allLists = await db.query.lists.findMany({
        orderBy: (lists, { asc }) => [asc(lists.name)],
      })

      return Promise.all(
        allLists.map(async (list) => ({
          ...list,
          todoCount: await getTodoCount(list.id),
        })),
      )
    })
  },
)

// Get a single list by ID
export const getListById = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'getListById' }, async () => {
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, ctx.data),
      })

      if (!list) {
        throw new Error('List not found')
      }

      return {
        ...list,
        todoCount: await getTodoCount(list.id),
      }
    })
  })

// Create a new list
export const createList = createServerFn({ method: 'POST' })
  .inputValidator(createListSchema)
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'createList' }, async () => {
      const data = createListSchema.parse(ctx.data)
      const [newList] = await db
        .insert(lists)
        .values({
          name: data.name,
          color: data.color,
        })
        .returning()

      return {
        ...newList,
        todoCount: 0,
      }
    })
  })

// Update a category
export const updateList = createServerFn({ method: 'POST' })
  .inputValidator(updateListSchema)
  .handler(async (ctx): Promise<ListWithCount> => {
    return Sentry.startSpan({ name: 'updateList' }, async () => {
      const data = updateListSchema.parse(ctx.data)
      const { id, ...updateData } = data

      const [updated] = await db
        .update(lists)
        .set(updateData)
        .where(eq(lists.id, id))
        .returning()

      return {
        ...updated,
        todoCount: await getTodoCount(id),
      }
    })
  })

// Delete a list (sets todos.listId to null via DB constraint)
export const deleteList = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<{ success: boolean; id: string }> => {
    return Sentry.startSpan({ name: 'deleteList' }, async () => {
      const id = ctx.data
      await db.delete(lists).where(eq(lists.id, id))
      return { success: true, id }
    })
  })

// Note: Bulk assign/remove operations are no longer needed since todos have a single listId field.
// To update a todo's list, use the updateTodo function with listId.
