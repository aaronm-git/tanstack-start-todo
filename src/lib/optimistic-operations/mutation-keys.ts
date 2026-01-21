/**
 * Centralized Mutation Key Factory
 * 
 * All mutations should use keys from this factory to enable
 * global tracking via useMutationState.
 */

/**
 * Mutation keys for todo operations
 */
export const todoMutationKeys = {
  /** Key for all todo mutations */
  all: ['todos'] as const,
  /** Key for creating a new todo */
  create: () => ['todos', 'create'] as const,
  /** Key for updating an existing todo */
  update: (id: string) => ['todos', 'update', id] as const,
  /** Key for deleting a todo */
  delete: (id: string) => ['todos', 'delete', id] as const,
  /** Key for toggling todo completion status */
  toggle: (id: string) => ['todos', 'toggle', id] as const,
}

/**
 * Mutation keys for subtask operations
 */
export const subtaskMutationKeys = {
  /** Key for all subtask mutations */
  all: ['subtasks'] as const,
  /** Key for creating a new subtask */
  create: () => ['subtasks', 'create'] as const,
  /** Key for updating an existing subtask */
  update: (id: string) => ['subtasks', 'update', id] as const,
  /** Key for deleting a subtask */
  delete: (id: string) => ['subtasks', 'delete', id] as const,
  /** Key for toggling subtask completion status */
  toggle: (id: string) => ['subtasks', 'toggle', id] as const,
}

/**
 * Mutation keys for list operations
 */
export const listMutationKeys = {
  /** Key for all list mutations */
  all: ['lists'] as const,
  /** Key for creating a new list */
  create: () => ['lists', 'create'] as const,
  /** Key for updating an existing list */
  update: (id: string) => ['lists', 'update', id] as const,
  /** Key for deleting a list */
  delete: (id: string) => ['lists', 'delete', id] as const,
}

/**
 * Mutation keys for AI operations
 */
export const aiMutationKeys = {
  /** Key for all AI mutations */
  all: ['ai'] as const,
  /** Key for AI-generated todo creation */
  generateTodo: () => ['ai', 'generate-todo'] as const,
}

/**
 * Combined mutation keys object for convenient access
 */
export const mutationKeys = {
  todos: todoMutationKeys,
  subtasks: subtaskMutationKeys,
  lists: listMutationKeys,
  ai: aiMutationKeys,
} as const

/**
 * Filter to match all tracked mutations
 * Use with useMutationState to get all optimistic operations
 */
export const allTrackedMutationsFilter = {
  predicate: (mutation: { options: { mutationKey?: readonly unknown[] } }) => {
    const key = mutation.options.mutationKey
    if (!key || key.length === 0) return false
    
    const firstKey = key[0]
    return firstKey === 'todos' || firstKey === 'subtasks' || firstKey === 'lists' || firstKey === 'ai'
  },
}

/**
 * Type helper for mutation key arrays
 */
export type MutationKeyArray = readonly (string | number)[]
