# Subtasks Implementation

Simple checklist items (Wunderlist-style) for breaking down todos into actionable steps.

## Overview

Subtasks are lightweight checklist items stored in a separate `subtasks` table. Unlike the previous implementation where subtasks were full todos with `parentId`, the new approach keeps subtasks simple with only the essential fields: name and completion status.

## Database Schema

### Table: `subtasks`

```sql
CREATE TABLE subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  order_index text NOT NULL DEFAULT '0',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Key Design Decisions

1. **Separate table**: Subtasks are not todos - they're a distinct entity
2. **Simple fields**: Only `name` and `isComplete` - no priority, description, or dueDate
3. **Order preservation**: `orderIndex` field maintains user-defined order
4. **Cascade delete**: Deleting a todo automatically deletes its subtasks

### Migration from Previous System

The previous system used `todos.parentId` to create a self-referential relationship. The migration:
1. Created the new `subtasks` table
2. Copied data from todos with `parentId` to the new table
3. Deleted migrated subtasks from todos
4. Dropped the `parentId` column

See: `drizzle/0003_create_subtasks_table.sql`

## Type System

### Base Types

```typescript
// src/lib/tasks.ts
import { subtasks } from '../db/schema'

export const subtaskSchema = createSelectSchema(subtasks)
export type Subtask = z.infer<typeof subtaskSchema>
```

### Composed Types

```typescript
export const todoWithRelationsSchema = todoSchema.extend({
  list: listSchema.nullable().optional(),
  subtasks: z.array(subtaskSchema).optional(),
})
```

### Input Types

```typescript
export const createSubtaskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  todoId: z.uuid(),
  orderIndex: z.string().optional(),
})

export const updateSubtaskSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255).optional(),
  isComplete: z.boolean().optional(),
  orderIndex: z.string().optional(),
})
```

## Server Functions

Located in `src/lib/server/subtasks.ts`:

### CRUD Operations

- **`createSubtask`**: Create a new subtask with automatic order
- **`updateSubtask`**: Update subtask name or completion status
- **`deleteSubtask`**: Remove a subtask
- **`toggleSubtaskComplete`**: Toggle completion status
- **`getSubtasksForTodo`**: Fetch all subtasks for a todo (ordered)

### Order Preservation

Subtasks are ordered by:
1. `orderIndex` (primary sort)
2. `createdAt` (secondary sort)
3. `id` (tertiary sort for stability)

```typescript
orderBy: (subtasks, { asc }) => [
  asc(subtasks.orderIndex),
  asc(subtasks.createdAt),
  asc(subtasks.id),
]
```

The `orderIndex` defaults to the creation timestamp, ensuring stable ordering even when completion status changes.

## Frontend Integration

### Components

- **`SubtaskDialog`** (`src/components/todos/subtask-dialog.tsx`)
  - Simple dialog with just a name input field
  - Used for both creating and editing subtasks

- **`TodoDetailPanel`** (`src/components/todos/todo-detail-panel.tsx`)
  - Displays subtasks as checkboxes with names
  - "Add subtask" button
  - Edit/delete actions via dropdown menu

- **`TodoCard`** (`src/components/todos/todo-card.tsx`)
  - Shows subtask count in accordion
  - Renders subtasks as simple checkboxes

### Mutations

Located in `src/routes/dashboard.tsx`:

```typescript
const toggleSubtaskCompleteMutation = useMutation({
  mutationFn: (id: string) => toggleSubtaskComplete({ data: id }),
  onMutate: async (id) => {
    // Optimistically update subtask status
    // Preserves order by mapping over existing array
  },
  onSuccess: () => {
    // Don't invalidate to preserve order
  },
})
```

### Order Preservation Strategy

To prevent completed subtasks from reordering:
1. **Database level**: Explicit `ORDER BY` clause with stable sort keys
2. **Optimistic updates**: Map over existing array, preserving order
3. **No refetch on toggle**: Avoid invalidating queries to prevent reordering

## AI Integration

When AI creates subtasks (via `generateTodoWithAI`):

```typescript
await db.insert(subtasks).values(
  result.subtasks.map((subtask, index) => ({
    name: subtask.name,
    todoId: newTodo.id,
    isComplete: false,
    orderIndex: index.toString(), // Sequential order
  }))
)
```

The AI schema for subtasks is minimal:

```typescript
export const aiSubtaskSchema = z.object({
  name: z.string().describe(
    'A concise, actionable subtask name. Start with a verb when appropriate.'
  ),
})
```

## Related Code

- **Schema**: `src/db/schema.ts` - Table definition and relations
- **Types**: `src/lib/tasks.ts` - Schemas and types
- **Server**: `src/lib/server/subtasks.ts` - CRUD operations
- **Components**: `src/components/todos/subtask-dialog.tsx`, `todo-detail-panel.tsx`
- **Integration**: `src/routes/dashboard.tsx` - Mutations and handlers

## User Documentation

- [How to use Subtasks](../user/subtasks.md)
