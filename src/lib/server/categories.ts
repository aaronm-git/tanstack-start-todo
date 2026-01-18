import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { z } from 'zod'
import { db } from '../../db'
import { categories, todoCategories } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

// Import schemas and types from single source of truth
import {
  createCategorySchema,
  updateCategorySchema,
  type CategoryWithCount,
} from '../tasks'

// Helper to get todo count for a category
async function getTodoCount(categoryId: string): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${todoCategories.todoId})`,
    })
    .from(todoCategories)
    .where(eq(todoCategories.categoryId, categoryId))

  return Number(result?.count || 0)
}

// Get all categories with todo counts
export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryWithCount[]> => {
    return Sentry.startSpan({ name: 'getCategories' }, async () => {
      const allCategories = await db.query.categories.findMany({
        orderBy: (categories, { asc }) => [asc(categories.name)],
      })

      return Promise.all(
        allCategories.map(async (category) => ({
          ...category,
          todoCount: await getTodoCount(category.id),
        })),
      )
    })
  },
)

// Get a single category by ID
export const getCategoryById = createServerFn({ method: 'GET' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<CategoryWithCount> => {
    return Sentry.startSpan({ name: 'getCategoryById' }, async () => {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, ctx.data),
      })

      if (!category) {
        throw new Error('Category not found')
      }

      return {
        ...category,
        todoCount: await getTodoCount(category.id),
      }
    })
  })

// Create a new category
export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator(createCategorySchema)
  .handler(async (ctx): Promise<CategoryWithCount> => {
    return Sentry.startSpan({ name: 'createCategory' }, async () => {
      const data = createCategorySchema.parse(ctx.data)
      const [newCategory] = await db
        .insert(categories)
        .values({
          name: data.name,
          color: data.color,
        })
        .returning()

      return {
        ...newCategory,
        todoCount: 0,
      }
    })
  })

// Update a category
export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator(updateCategorySchema)
  .handler(async (ctx): Promise<CategoryWithCount> => {
    return Sentry.startSpan({ name: 'updateCategory' }, async () => {
      const data = updateCategorySchema.parse(ctx.data)
      const { id, ...updateData } = data

      const [updated] = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning()

      return {
        ...updated,
        todoCount: await getTodoCount(id),
      }
    })
  })

// Delete a category (cascades to todo_categories via DB constraints)
export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator(z.uuid())
  .handler(async (ctx): Promise<{ success: boolean; id: string }> => {
    return Sentry.startSpan({ name: 'deleteCategory' }, async () => {
      const id = ctx.data
      await db.delete(categories).where(eq(categories.id, id))
      return { success: true, id }
    })
  })

// Input schema for assigning categories - defined locally since it's specific to this function
const assignCategoriesInputSchema = z.object({
  todoId: z.uuid(),
  categoryIds: z.array(z.uuid()),
})

// Assign categories to a todo
export const assignCategoriesToTodo = createServerFn({ method: 'POST' })
  .inputValidator(assignCategoriesInputSchema)
  .handler(
    async (
      ctx,
    ): Promise<{ success: boolean; todoId: string; categoryIds: string[] }> => {
      return Sentry.startSpan({ name: 'assignCategoriesToTodo' }, async () => {
        const { todoId, categoryIds } = ctx.data

        // Remove existing category assignments
        await db.delete(todoCategories).where(eq(todoCategories.todoId, todoId))

        // Add new category assignments
        if (categoryIds.length > 0) {
          await db.insert(todoCategories).values(
            categoryIds.map((categoryId) => ({
              todoId,
              categoryId,
            })),
          )
        }

        return { success: true, todoId, categoryIds }
      })
    },
  )

// Input schema for removing a category from a todo
const removeCategoryInputSchema = z.object({
  todoId: z.uuid(),
  categoryId: z.uuid(),
})

// Remove a category from a todo
export const removeCategoryFromTodo = createServerFn({ method: 'POST' })
  .inputValidator(removeCategoryInputSchema)
  .handler(
    async (
      ctx,
    ): Promise<{ success: boolean; todoId: string; categoryId: string }> => {
      return Sentry.startSpan({ name: 'removeCategoryFromTodo' }, async () => {
        const { todoId, categoryId } = ctx.data

        await db
          .delete(todoCategories)
          .where(
            sql`${todoCategories.todoId} = ${todoId} AND ${todoCategories.categoryId} = ${categoryId}`,
          )

        return { success: true, todoId, categoryId }
      })
    },
  )
