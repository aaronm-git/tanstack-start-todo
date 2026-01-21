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

// Get all todos with their list and subtasks
export const getTodos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TodoWithRelations[]> => {
    return Sentry.startSpan({ name: 'getTodos' }, async () => {
      const result = await db.query.todos.findMany({
        with: todoWithRelationsQueryConfig,
        orderBy: [desc(todos.createdAt)], // Newest first
      })
      return result as TodoWithRelations[]
    })
  },
)

// Get a single todo by ID
export const getTodoById = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'getTodoById' }, async () => {
      const result = await db.query.todos.findFirst({
        where: eq(todos.id, ctx.data),
        with: todoWithRelationsQueryConfig,
      })
      return result as TodoWithRelations | undefined
    })
  })

// Create a new todo
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(createTodoSchema)
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'createTodo' }, async () => {
      const data = createTodoSchema.parse(ctx.data)

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
      return todoWithRelations as TodoWithRelations | undefined
    })
  })

// Update a todo
export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(updateTodoSchema)
  .handler(async (ctx): Promise<TodoWithRelations | undefined> => {
    return Sentry.startSpan({ name: 'updateTodo' }, async () => {
      const data = updateTodoSchema.parse(ctx.data)
      const { id, listId, updatedAt, ...updateData } = data

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
      return todoWithRelations as TodoWithRelations | undefined
    })
  })

// Toggle todo completion status
export const toggleTodoComplete = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<Todo> => {
    return Sentry.startSpan({ name: 'toggleTodoComplete' }, async () => {
      const id = ctx.data

      // Get current status
      const todo = await db.query.todos.findFirst({
        where: eq(todos.id, id),
      })

      if (!todo) {
        throw new Error('Todo not found')
      }

      // Toggle the status
      const result = await db
        .update(todos)
        .set({ isComplete: !todo.isComplete })
        .where(eq(todos.id, id))
        .returning()

      const updated = result[0] as Todo
      return updated
    })
  })

// Delete a todo (cascades to subtasks via DB constraints)
export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<{ success: boolean; id: string }> => {
    return Sentry.startSpan({ name: 'deleteTodo' }, async () => {
      const id = ctx.data
      await db.delete(todos).where(eq(todos.id, id))
      return { success: true, id }
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
    return Sentry.startSpan({ name: 'getTodoStats' }, async () => {
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
    })
  },
)
