import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { db } from '../../db'
import { todos } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

// Import schemas and config from single source of truth
import {
  createTodoSchema,
  updateTodoSchema,
  todoWithRelationsQueryConfig,
  type TodoWithRelations,
  type Todo,
} from '../tasks'

import { serverLog, PERF_THRESHOLDS, logIfSlow } from './logging'

// Get all todos with their list and subtasks
export const getTodos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TodoWithRelations[]> => {
    return Sentry.startSpan({ name: 'getTodos', op: 'db.query' }, async () => {
      const startTime = Date.now()

      try {
        const result = await db.query.todos.findMany({
          with: todoWithRelationsQueryConfig,
          orderBy: [desc(todos.createdAt)],
        })

        logIfSlow('db.todos.findMany', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          count: result.length,
        })

        serverLog.info('todo.list.fetched', { count: result.length })
        return result as TodoWithRelations[]
      } catch (error) {
        serverLog.error('todo.list.failed', {
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'getTodos' },
        })
        throw error
      }
    })
  },
)

// Get a single todo by ID
export const getTodoById = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'getTodoById', op: 'db.query' }, async () => {
      const startTime = Date.now()

      try {
        const result = await db.query.todos.findFirst({
          where: eq(todos.id, ctx.data),
          with: todoWithRelationsQueryConfig,
        })

        logIfSlow('db.todos.findFirst', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId: ctx.data,
          found: !!result,
        })

        if (!result) {
          serverLog.warn('todo.get.notFound', { todoId: ctx.data })
        }

        return result as TodoWithRelations | undefined
      } catch (error) {
        serverLog.error('todo.get.failed', { todoId: ctx.data })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'getTodoById' },
          extra: { todoId: ctx.data },
        })
        throw error
      }
    })
  })

// Create a new todo
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(createTodoSchema)
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'createTodo', op: 'db.insert' }, async () => {
      const startTime = Date.now()

      try {
        const data = createTodoSchema.parse(ctx.data)

        serverLog.info('todo.create.started', {
          priority: data.priority,
          hasListId: !!data.listId,
          hasDueDate: !!data.dueDate,
          hasDescription: !!data.description,
        })

        // Create the todo
        const result = await db
          .insert(todos)
          .values({
            name: data.name,
            description: data.description,
            priority: data.priority,
            dueDate: data.dueDate || null,
            listId: data.listId ?? null,
          })
          .returning()

        const newTodo = (result as Todo[])[0]

        // Fetch the complete todo with relations
        const todoWithRelations = await db.query.todos.findFirst({
          where: eq(todos.id, newTodo.id),
          with: todoWithRelationsQueryConfig,
        })

        const durationMs = Date.now() - startTime
        serverLog.info('todo.create.success', {
          todoId: newTodo.id,
          priority: newTodo.priority,
          hasListId: !!newTodo.listId,
          durationMs,
        })

        logIfSlow('db.todos.insert', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId: newTodo.id,
        })

        return todoWithRelations as TodoWithRelations | undefined
      } catch (error) {
        serverLog.error('todo.create.failed', {
          priority: ctx.data?.priority,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'createTodo' },
          extra: { priority: ctx.data?.priority, hasListId: !!ctx.data?.listId },
        })
        throw error
      }
    })
  })

// Update a todo
export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateTodoSchema)
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'updateTodo', op: 'db.update' }, async () => {
      const startTime = Date.now()

      try {
        const data = updateTodoSchema.parse(ctx.data)
        const { id, listId, updatedAt, ...updateData } = data

        // Track what fields are being updated
        const updatedFields = Object.keys(updateData).filter(
          (key) => updateData[key as keyof typeof updateData] !== undefined,
        )

        serverLog.info('todo.update.started', {
          todoId: id,
          updatedFields: updatedFields.join(','),
          hasListUpdate: listId !== undefined,
        })

        // Prepare update object with updatedAt if provided
        const updateObject: Record<string, unknown> = { ...updateData }
        if (updatedAt !== undefined) {
          updateObject.updatedAt = updatedAt
        }

        // Only update if there are fields to update (spread removes undefined values)
        const hasFieldsToUpdate = Object.values(updateObject).some(
          (v) => v !== undefined,
        )
        if (hasFieldsToUpdate) {
          await db.update(todos).set(updateObject).where(eq(todos.id, id))
        }

        // Update listId if provided
        if (listId !== undefined) {
          const listUpdateObject: Record<string, unknown> = { listId }
          if (updatedAt !== undefined) {
            listUpdateObject.updatedAt = updatedAt
          }
          await db.update(todos).set(listUpdateObject).where(eq(todos.id, id))
        }

        // Fetch the updated todo with relations
        const todoWithRelations = await db.query.todos.findFirst({
          where: eq(todos.id, id),
          with: todoWithRelationsQueryConfig,
        })

        const durationMs = Date.now() - startTime
        serverLog.info('todo.update.success', {
          todoId: id,
          updatedFieldsCount: updatedFields.length,
          durationMs,
        })

        logIfSlow('db.todos.update', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId: id,
        })

        return todoWithRelations as TodoWithRelations | undefined
      } catch (error) {
        serverLog.error('todo.update.failed', {
          todoId: ctx.data?.id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'updateTodo' },
          extra: { todoId: ctx.data?.id },
        })
        throw error
      }
    })
  })

// Toggle todo completion status
export const toggleTodoComplete = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Todo> => {
    return Sentry.startSpan({ name: 'toggleTodoComplete', op: 'db.update' }, async () => {
      const id = ctx.data
      const startTime = Date.now()

      try {
        // Get current status
        const todo = await db.query.todos.findFirst({
          where: eq(todos.id, id),
        })

        if (!todo) {
          serverLog.warn('todo.toggle.notFound', { todoId: id })
          throw new Error('Todo not found')
        }

        // Toggle the status
        const result = await db
          .update(todos)
          .set({ isComplete: !todo.isComplete })
          .where(eq(todos.id, id))
          .returning()

        const updated = result[0] as Todo

        serverLog.info('todo.status.changed', {
          todoId: id,
          fromComplete: todo.isComplete,
          toComplete: updated.isComplete,
          priority: todo.priority,
        })

        logIfSlow('db.todos.toggle', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId: id,
        })

        return updated
      } catch (error) {
        if (!(error instanceof Error && error.message === 'Todo not found')) {
          serverLog.error('todo.toggle.failed', {
            todoId: id,
            errorType: error instanceof Error ? error.name : 'Unknown',
          })
          Sentry.captureException(error, {
            tags: { component: 'todos', operation: 'toggleTodoComplete' },
            extra: { todoId: id },
          })
        }
        throw error
      }
    })
  })

// Delete a todo (cascades to subtasks via DB constraints)
export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<{ success: boolean; id: string }> => {
    return Sentry.startSpan({ name: 'deleteTodo', op: 'db.delete' }, async () => {
      const id = ctx.data
      const startTime = Date.now()

      try {
        serverLog.info('todo.delete.started', { todoId: id })

        await db.delete(todos).where(eq(todos.id, id))

        const durationMs = Date.now() - startTime
        serverLog.info('todo.delete.success', { todoId: id, durationMs })

        logIfSlow('db.todos.delete', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          todoId: id,
        })

        return { success: true, id }
      } catch (error) {
        serverLog.error('todo.delete.failed', {
          todoId: id,
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'deleteTodo' },
          extra: { todoId: id },
        })
        throw error
      }
    })
  })

// Stats type for getTodoStats return value
export interface TodoStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  priorityStats: {
    critical: number
    urgent: number
    high: number
    medium: number
    low: number
  }
  tasksDueToday: number
  tasksDueTomorrow: number
  tasksDueThisWeek: number
  overdueTasks: number
  recentlyCompleted: number
  totalCategories: number
}

// Get statistics for the homepage
export const getTodoStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TodoStats> => {
    return Sentry.startSpan({ name: 'getTodoStats', op: 'db.query' }, async () => {
      const startTime = Date.now()

      try {
        // Get all todos (including subtasks)
        const allTodos = await db.query.todos.findMany()

        // Get all lists
        const allLists = await db.query.lists.findMany()

        // Calculate basic stats
        const totalTasks = allTodos.length
        const completedTasks = allTodos.filter((t) => t.isComplete).length
        const pendingTasks = totalTasks - completedTasks
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // Tasks by priority
        const priorityStats = {
          critical: allTodos.filter((t) => t.priority === 'critical').length,
          urgent: allTodos.filter((t) => t.priority === 'urgent').length,
          high: allTodos.filter((t) => t.priority === 'high').length,
          medium: allTodos.filter((t) => t.priority === 'medium').length,
          low: allTodos.filter((t) => t.priority === 'low').length,
        }

        // Tasks due soon
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)

        const tasksDueToday = allTodos.filter((t) => {
          if (!t.dueDate || t.isComplete) return false
          const dueDate = new Date(t.dueDate)
          return dueDate.toDateString() === now.toDateString()
        }).length

        const tasksDueTomorrow = allTodos.filter((t) => {
          if (!t.dueDate || t.isComplete) return false
          const dueDate = new Date(t.dueDate)
          return dueDate.toDateString() === tomorrow.toDateString()
        }).length

        const tasksDueThisWeek = allTodos.filter((t) => {
          if (!t.dueDate || t.isComplete) return false
          const dueDate = new Date(t.dueDate)
          return dueDate >= now && dueDate <= nextWeek
        }).length

        // Overdue tasks
        const overdueTasks = allTodos.filter((t) => {
          if (!t.dueDate || t.isComplete) return false
          return new Date(t.dueDate) < now
        }).length

        // Recently completed (last 7 days)
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentlyCompleted = allTodos.filter((t) => {
          if (!t.isComplete || !t.updatedAt) return false
          return new Date(t.updatedAt) >= sevenDaysAgo
        }).length

        const durationMs = Date.now() - startTime

        // Log stats computation with key metrics
        serverLog.info('stats.computed', {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate,
          durationMs,
        })

        logIfSlow('db.stats.compute', startTime, PERF_THRESHOLDS.DB_QUERY_SLOW, {
          totalTasks,
        })

        return {
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate,
          priorityStats,
          tasksDueToday,
          tasksDueTomorrow,
          tasksDueThisWeek,
          overdueTasks,
          recentlyCompleted,
          totalCategories: allLists.length,
        }
      } catch (error) {
        serverLog.error('stats.compute.failed', {
          errorType: error instanceof Error ? error.name : 'Unknown',
        })
        Sentry.captureException(error, {
          tags: { component: 'todos', operation: 'getTodoStats' },
        })
        throw error
      }
    })
  },
)
