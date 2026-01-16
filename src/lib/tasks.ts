import { z } from 'zod'
import type { Priority } from '../db/schema'

// Priority labels and utilities
export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  critical: 'Critical',
}

export function getPriorityLabel(priority: Priority): string {
  return priorityLabels[priority] ?? 'Unknown'
}

// Check if a date is overdue (past the current date)
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

// Priority colors for UI
export const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-red-600 text-white',
}

// Zod schemas for validation
export const createTodoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).default(''),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent', 'critical'])
    .default('low'),
  dueDate: z.date().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).default([]),
})

export const updateTodoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  dueDate: z.date().optional().nullable(),
  isComplete: z.boolean().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .default(null),
})

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
})

// Type exports for use in components
export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// Todo with relations type for frontend
export interface TodoWithRelations {
  id: string
  name: string
  description: string
  priority: Priority
  isComplete: boolean
  dueDate: Date | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  categories: Array<{
    category: {
      id: string
      name: string
      color: string | null
    }
  }>
  subtasks?: TodoWithRelations[]
  parent?: TodoWithRelations | null
}

// Category with todo count
export interface CategoryWithCount {
  id: string
  name: string
  color: string | null
  createdAt: Date
  updatedAt: Date
  todoCount: number
}
