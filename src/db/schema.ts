import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'urgent',
  'critical',
])

export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical'

// Recurrence pattern types for recurring todos
export const recurrenceTypeEnum = pgEnum('recurrence_type', [
  'daily',
  'weekly',
  'monthly',
  'annually',
  'custom',
])

export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'annually'
  | 'custom'

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Define todos table first (before todoCategories) to avoid circular reference issues
// Note: Self-references (parentId, recurringTodoId) use arrow functions to handle circular dependencies
// TypeScript has limitations with self-referencing tables, but this works correctly at runtime
// @ts-ignore - TypeScript limitation with self-referencing tables in Drizzle ORM
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priority: priorityEnum('priority').notNull().default('low'),
  isComplete: boolean().notNull().default(false),
  dueDate: timestamp({ withTimezone: true }),

  // Nested todos support: Reference to parent todo for creating subtasks
  // If null, this is a top-level todo. If set, this is a subtask of another todo
  // @ts-ignore - TypeScript limitation with self-referencing tables
  parentId: uuid('parent_id').references(() => todos.id, {
    onDelete: 'cascade',
  }),

  // Recurring todos support
  // If recurrenceType is set, this todo repeats according to the pattern
  recurrenceType: recurrenceTypeEnum('recurrence_type'),

  // Recurrence configuration stored as JSON for flexible patterns
  // For 'custom' recurrence, this can store complex rules like "every 3rd Tuesday"
  // Format: { interval: number, dayOfWeek?: number[], dayOfMonth?: number, etc. }
  recurrenceConfig: text('recurrence_config'), // JSON string

  // Reference to the original recurring todo template
  // When instances are auto-created, they reference this parent recurring todo
  // The template todo itself has recurrenceType set, instances have this field set
  recurringTodoId: uuid('recurring_todo_id').references(() => todos.id, {
    onDelete: 'cascade',
  }),

  // Next occurrence date for recurring todos
  // Used to determine when the next instance should be created
  nextOccurrence: timestamp({ withTimezone: true }),

  // End date for recurring todos (optional)
  // If set, the recurrence stops after this date
  recurrenceEndDate: timestamp({ withTimezone: true }),

  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Join table for many-to-many relationship between todos and categories
// Defined after todos table to avoid circular reference
export const todoCategories = pgTable('todo_categories', {
  todoId: uuid('todo_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
})

// Reminders table: Separate table to support multiple reminders per todo
// This allows users to set multiple reminders (e.g., 1 day before, 1 hour before)
// For recurring todos, reminders are stored on the template and inherited by instances
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  todoId: uuid('todo_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),

  // When the reminder should fire (absolute timestamp)
  // For recurring todos, this is calculated relative to the instance's dueDate
  remindAt: timestamp({ withTimezone: true }).notNull(),

  // Whether the reminder has been sent/triggered
  isSent: boolean().notNull().default(false),

  // Optional notification method (email, push, in-app, etc.)
  // Stored as text for flexibility, could be an enum if needed
  notificationMethod: text('notification_method'),

  // For recurring todos: Reminder offset stored as JSON
  // Format: { value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' }
  // Example: { value: 1, unit: 'days' } means "1 day before due date"
  // If set, this reminder is inherited by recurring instances with adjusted remindAt dates
  // If null, this is a one-time reminder for a specific todo instance
  reminderOffset: text('reminder_offset'), // JSON string

  // Reference to the recurring template this reminder belongs to (if applicable)
  // If set, this reminder is part of the template and will be copied to instances
  // If null, this reminder is for a specific todo instance only
  recurringTemplateId: uuid('recurring_template_id').references(() => todos.id, {
    onDelete: 'cascade',
  }),

  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

// Set up table relationships for our database using Drizzle ORM

// Define how the "todos" table relates to others.
// @ts-ignore - TypeScript limitation with self-referencing relations in Drizzle ORM
export const todosRelations = relations(todos, ({ many, one }) => ({
  // A single todo can belong to many categories via the "todoCategories" join table.
  categories: many(todoCategories),

  // Nested todos: A todo can have many subtasks (children)
  subtasks: many(todos, {
    relationName: 'parentSubtasks', // Relation name to distinguish from other self-references
  }),

  // Nested todos: A todo can have one parent todo (if it's a subtask)
  parent: one(todos, {
    fields: [todos.parentId],
    references: [todos.id],
    relationName: 'parentSubtasks',
  }),

  // Recurring todos: A recurring template can have many instances
  recurringInstances: many(todos, {
    relationName: 'recurringInstances',
  }),

  // Recurring todos: An instance references its recurring template
  recurringTemplate: one(todos, {
    fields: [todos.recurringTodoId],
    references: [todos.id],
    relationName: 'recurringInstances',
  }),

  // A todo can have multiple reminders (for this specific instance)
  reminders: many(reminders),
  
  // If this is a recurring template, it can have template reminders
  // These reminders are inherited by all instances
  templateReminders: many(reminders, {
    relationName: 'templateReminders',
  }),
}))

// Define how the "categories" table relates to others.
// Here, a single category can have many todos, also via the "todoCategories" join table.
export const categoriesRelations = relations(categories, ({ many }) => ({
  // The 'todos' property lets us fetch all todos linked to this category via 'todoCategories'.
  todos: many(todoCategories),
}))

// Define relationships on the join table "todoCategories"
// This table links todos and categories by their IDs.
export const todoCategoriesRelations = relations(todoCategories, ({ one }) => ({
  // Each row here belongs to one todo.
  // 'fields' tells Drizzle which field on "todoCategories" (todoId) is used for the relation.
  // 'references' tells Drizzle which field it matches in the "todos" table (id).
  todo: one(todos, {
    fields: [todoCategories.todoId],
    references: [todos.id],
  }),
  // Each row here also belongs to one category (similar structure as above).
  category: one(categories, {
    fields: [todoCategories.categoryId],
    references: [categories.id],
  }),
}))

// Define relationships for reminders
export const remindersRelations = relations(reminders, ({ one }) => ({
  // Each reminder belongs to one todo (the instance)
  todo: one(todos, {
    fields: [reminders.todoId],
    references: [todos.id],
  }),
  // If this reminder is part of a recurring template, link to the template
  // This allows fetching all reminders for a recurring todo template
  recurringTemplate: one(todos, {
    fields: [reminders.recurringTemplateId],
    references: [todos.id],
    relationName: 'templateReminders',
  }),
}))

// Update todos relations to include template reminders
// (This needs to be added to the existing todosRelations)

// ============================================================
// Better Auth Schema Integration
// ============================================================
// Import and re-export Better Auth tables so they're included in migrations
export * from '../../auth-schema'
