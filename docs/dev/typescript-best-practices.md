# TypeScript Best Practices

This document outlines TypeScript best practices and conventions used throughout the codebase.

## Type Safety Principles

### 1. No Type Assertions (`as`)

**Avoid type assertions** - they bypass TypeScript's type checking:

```typescript
// ❌ Bad - Unsafe type assertion
const todo = result as TodoWithRelations

// ✅ Good - Use Zod validation
const todo = todoWithRelationsSchema.parse(result)
```

### 2. Use Type Predicates for Narrowing

When you need to narrow types, use type predicates:

```typescript
// ✅ Good - Type predicate function
function isTodoWithRelations(value: unknown): value is TodoWithRelations {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'list' in value
  )
}

if (isTodoWithRelations(result)) {
  // TypeScript knows result is TodoWithRelations here
  console.log(result.name)
}
```

### 3. Prefer `z.infer` Over Manual Types

Always derive types from Zod schemas:

```typescript
// ✅ Good - Derived from schema
export type Todo = z.infer<typeof todoSchema>

// ❌ Bad - Manual type definition
export type Todo = {
  id: string
  name: string
  // ... gets out of sync
}
```

## Import Conventions

### Type-Only Imports

Use `type` keyword for type-only imports:

```typescript
// ✅ Good - Type-only import
import type { TodoWithRelations } from '../../lib/tasks'

// ✅ Also good - Mixed imports
import { todoWithRelationsSchema, type TodoWithRelations } from '../../lib/tasks'

// ❌ Bad - Value import when only type is needed
import { TodoWithRelations } from '../../lib/tasks' // If only used as type
```

### Schema vs Type Imports

- **Schemas** (runtime values): Regular import
- **Types** (compile-time only): Type-only import

```typescript
// Schema - used at runtime for validation
import { todoWithRelationsSchema } from '../../lib/tasks'

// Type - used only for TypeScript
import type { TodoWithRelations } from '../../lib/tasks'
```

## Function Type Annotations

### Explicit Return Types

Prefer explicit return types for public functions:

```typescript
// ✅ Good - Explicit return type
export function getPriorityLabel(priority: Priority): string {
  return priorityLabels[priority] ?? 'Unknown'
}

// ⚠️ Acceptable - Inferred return type for simple functions
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}
```

### Async Function Types

Always type async function returns:

```typescript
// ✅ Good - Explicit Promise type
async function fetchTodo(id: string): Promise<TodoWithRelations | null> {
  // ...
}

// ❌ Bad - Inferred Promise<any>
async function fetchTodo(id: string) {
  // ...
}
```

## Component Props

### Interface Definitions

Always define interfaces for component props:

```typescript
// ✅ Good - Explicit interface
interface TodoCardProps {
  todo: TodoWithRelations
  onEdit: (todo: TodoWithRelations) => void
  onDelete: (id: string) => void
  className?: string
}

export function TodoCard({ todo, onEdit, onDelete, className }: TodoCardProps) {
  // ...
}
```

### Inline Props (Avoid)

Avoid inline prop types for complex components:

```typescript
// ❌ Bad - Inline props (hard to reuse/extend)
export function TodoCard(props: {
  todo: TodoWithRelations
  onEdit: (todo: TodoWithRelations) => void
}) {
  // ...
}
```

## Server Functions

### Input Validation

Always use Zod schemas for input validation:

```typescript
// ✅ Good - Zod schema validation
export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(createTodoSchema)
  .handler(async (ctx) => {
    const data = createTodoSchema.parse(ctx.data)
    // ...
  })
```

### Return Type Inference

Let TypeScript infer return types from database queries, but validate with schemas:

```typescript
// ✅ Good - Validate return value
const todo = await db.query.todos.findFirst({ ... })
return todoWithRelationsSchema.parse(todo)

// ⚠️ Acceptable - If you're certain of the shape
return todo // TypeScript infers from Drizzle query
```

## Error Handling

### Typed Errors

Use typed error handling:

```typescript
// ✅ Good - Typed error
try {
  const result = await generateTodoWithAI({ data })
  return todoWithRelationsSchema.parse(result)
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message)
  }
  throw error
}
```

### Error Types

Define error types when needed:

```typescript
// ✅ Good - Custom error type
class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo with id ${id} not found`)
    this.name = 'TodoNotFoundError'
  }
}
```

## Generic Types

### Use Generics Sparingly

Only use generics when necessary:

```typescript
// ✅ Good - Generic when needed
function mapTodos<T extends Todo>(
  todos: T[],
  mapper: (todo: T) => unknown
): unknown[] {
  return todos.map(mapper)
}

// ❌ Bad - Unnecessary generic
function getTodo<T>(id: string): T {
  // Generic not needed here
}
```

## Utility Types

### Common Utility Types

Use TypeScript utility types effectively:

```typescript
// Partial - Make all properties optional
type PartialTodo = Partial<Todo>

// Pick - Select specific properties
type TodoSummary = Pick<Todo, 'id' | 'name' | 'priority'>

// Omit - Exclude specific properties
type TodoWithoutDates = Omit<Todo, 'createdAt' | 'updatedAt'>

// Record - Map type
type PriorityMap = Record<Priority, string>
```

## Null Safety

### Nullable Types

Be explicit about nullable types:

```typescript
// ✅ Good - Explicit nullable
function getTodo(id: string): TodoWithRelations | null {
  // ...
}

// ✅ Good - Optional chaining
const listName = todo.list?.name

// ❌ Bad - Non-null assertion (unsafe)
const name = todo.list!.name
```

### Optional Properties

Use `?` for optional properties:

```typescript
// ✅ Good - Optional property
interface TodoCardProps {
  todo: TodoWithRelations
  className?: string
  onEdit?: (todo: TodoWithRelations) => void
}
```

## Array Types

### Explicit Array Types

Prefer explicit array types:

```typescript
// ✅ Good - Explicit array type
const todos: TodoWithRelations[] = []

// ✅ Also good - Array syntax
const todos: Array<TodoWithRelations> = []

// ⚠️ Acceptable - Inferred (if obvious from context)
const todos = [] // Only if type is obvious
```

## Object Types

### Record vs Object

Use `Record` for key-value mappings:

```typescript
// ✅ Good - Record type
const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-100',
  medium: 'bg-blue-100',
  // ...
}

// ❌ Bad - Index signature
const priorityColors: { [key: Priority]: string } = {
  // ...
}
```

## Type Guards

### Custom Type Guards

Create type guards for runtime type checking:

```typescript
// ✅ Good - Type guard
function isTodo(value: unknown): value is Todo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as Todo).name === 'string'
  )
}

// Usage
if (isTodo(data)) {
  // TypeScript knows data is Todo
  console.log(data.name)
}
```

## Const Assertions

### Use `as const` for Literal Types

```typescript
// ✅ Good - Const assertion
export const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  // ...
} as const

// Type is: { readonly low: "Low"; readonly medium: "Medium"; ... }
```

## Related Documentation

- [TypeScript Type System](./typescript-types.md)
- [Architecture Overview](./architecture-overview.md)
