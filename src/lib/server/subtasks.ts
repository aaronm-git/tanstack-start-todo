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

// Get all subtasks for a specific todo
export const getSubtasksForTodo = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Subtask[]> => {
    return Sentry.startSpan({ name: 'getSubtasksForTodo' }, async () => {
      const result = await db.query.subtasks.findMany({
        where: eq(subtasks.todoId, ctx.data),
        orderBy: (subtasks, { asc }) => [
          asc(subtasks.orderIndex),
          asc(subtasks.createdAt),
          asc(subtasks.id),
        ],
      })
      return result as Subtask[]
    })
  })

// Create a new subtask
export const createSubtask = createServerFn({ method: 'POST' })
  .inputValidator(createSubtaskSchema)
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'createSubtask' }, async () => {
      const data = ctx.data

      const result = await db
        .insert(subtasks)
        .values({
          name: data.name,
          todoId: data.todoId,
          orderIndex: data.orderIndex || new Date().toISOString(), // Use timestamp as default order
          isComplete: false,
        })
        .returning()

      return result[0] as Subtask
    })
  })

// Update a subtask
export const updateSubtask = createServerFn({ method: 'POST' })
  .inputValidator(updateSubtaskSchema)
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'updateSubtask' }, async () => {
      const { id, ...updateData } = ctx.data

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined),
      )

      const result = await db
        .update(subtasks)
        .set(cleanData)
        .where(eq(subtasks.id, id))
        .returning()

      return result[0] as Subtask
    })
  })

// Toggle subtask completion status
export const toggleSubtaskComplete = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Subtask | undefined> => {
    return Sentry.startSpan({ name: 'toggleSubtaskComplete' }, async () => {
      const id = ctx.data

      // First get the current status
      const [current] = await db
        .select({ isComplete: subtasks.isComplete })
        .from(subtasks)
        .where(eq(subtasks.id, id))

      if (!current) return undefined

      // Toggle it
      const result = await db
        .update(subtasks)
        .set({ isComplete: !current.isComplete })
        .where(eq(subtasks.id, id))
        .returning()

      return result[0] as Subtask
    })
  })

// Delete a subtask
export const deleteSubtask = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<void> => {
    return Sentry.startSpan({ name: 'deleteSubtask' }, async () => {
      await db.delete(subtasks).where(eq(subtasks.id, ctx.data))
    })
  })
