import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { db } from '../../db'
import { categories, todoCategories, todos } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryWithCount,
} from '../tasks'

// Get all categories with todo counts
export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'getCategories' }, async () => {
    // Get all categories
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    })

    // Get todo counts for each category
    const categoriesWithCounts = await Promise.all(
      allCategories.map(async (category) => {
        const [result] = await db
          .select({
            count: sql<number>`count(distinct ${todoCategories.todoId})`,
          })
          .from(todoCategories)
          .where(eq(todoCategories.categoryId, category.id))

        return {
          ...category,
          todoCount: Number(result?.count || 0),
        } as CategoryWithCount
      }),
    )

    return categoriesWithCounts
  })
})

// Get a single category by ID
export const getCategoryById = createServerFn({ method: 'GET' }).handler(
  async (ctx: { data: string }) => {
    return Sentry.startSpan({ name: 'getCategoryById' }, async () => {
      const id = ctx.data
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, id),
      })

      if (!category) {
        throw new Error('Category not found')
      }

      // Get todo count
      const [result] = await db
        .select({
          count: sql<number>`count(distinct ${todoCategories.todoId})`,
        })
        .from(todoCategories)
        .where(eq(todoCategories.categoryId, category.id))

      return {
        ...category,
        todoCount: Number(result?.count || 0),
      } as CategoryWithCount
    })
  },
)

// Create a new category
export const createCategory = createServerFn({ method: 'POST' }).handler(
  async (ctx: { data: CreateCategoryInput }) => {
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
      } as CategoryWithCount
    })
  },
)

// Update a category
export const updateCategory = createServerFn({ method: 'POST' }).handler(
  async (ctx: { data: UpdateCategoryInput }) => {
    return Sentry.startSpan({ name: 'updateCategory' }, async () => {
      const data = updateCategorySchema.parse(ctx.data)
      const { id, ...updateData } = data

      const updateFields: any = {}
      if (updateData.name !== undefined) updateFields.name = updateData.name
      if (updateData.color !== undefined) updateFields.color = updateData.color

      const [updated] = await db
        .update(categories)
        .set(updateFields)
        .where(eq(categories.id, id))
        .returning()

      // Get todo count
      const [result] = await db
        .select({
          count: sql<number>`count(distinct ${todoCategories.todoId})`,
        })
        .from(todoCategories)
        .where(eq(todoCategories.categoryId, id))

      return {
        ...updated,
        todoCount: Number(result?.count || 0),
      } as CategoryWithCount
    })
  },
)

// Delete a category (cascades to todo_categories via DB constraints)
export const deleteCategory = createServerFn({ method: 'POST' }).handler(
  async (ctx: { data: string }) => {
    return Sentry.startSpan({ name: 'deleteCategory' }, async () => {
      const id = ctx.data
      await db.delete(categories).where(eq(categories.id, id))
      return { success: true, id }
    })
  },
)

// Assign categories to a todo
export const assignCategoriesToTodo = createServerFn({ method: 'POST' }).handler(
  async (ctx: { data: { todoId: string; categoryIds: string[] } }) => {
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

// Remove a category from a todo
export const removeCategoryFromTodo = createServerFn({ method: 'POST' }).handler(
  async (ctx: { data: { todoId: string; categoryId: string } }) => {
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
