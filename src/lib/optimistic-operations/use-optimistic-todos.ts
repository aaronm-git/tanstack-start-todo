/**
 * useOptimisticTodos Hook
 * 
 * Implements the "Via the UI" approach from TanStack Query docs for optimistic updates.
 * Instead of updating the cache during mutations (which causes re-renders and focus loss),
 * this hook merges pending mutation variables with cached data at render time.
 * 
 * This preserves focus in input fields because no cache updates happen while typing.
 * 
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
 */

import { useMemo } from 'react'
import { useMutationState } from '@tanstack/react-query'
import type { TodoWithRelations, UpdateTodoInput, Subtask } from '../tasks'

/**
 * Hook that merges pending todo update mutations with cached todos at render time.
 * 
 * This is the key to preserving focus during inline editing:
 * - No cache updates during mutation lifecycle
 * - Pending changes are applied at render time via useMutationState
 * - Cache is only updated in onSettled (after mutation completes)
 * 
 * @param cachedTodos - The todos from the React Query cache
 * @returns Todos with pending optimistic updates applied
 */
export function useOptimisticTodos(cachedTodos: TodoWithRelations[]): TodoWithRelations[] {
  // Get all pending todo update mutations
  const pendingUpdates = useMutationState({
    filters: { 
      // Match all todo update mutations (key pattern: ['todos', 'update', id])
      predicate: (mutation) => {
        const key = mutation.options.mutationKey
        return Array.isArray(key) && key[0] === 'todos' && key[1] === 'update'
      },
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables as UpdateTodoInput | undefined,
  })

  // Get all pending todo toggle mutations
  const pendingToggles = useMutationState({
    filters: {
      predicate: (mutation) => {
        const key = mutation.options.mutationKey
        return Array.isArray(key) && key[0] === 'todos' && key[1] === 'toggle'
      },
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables as string | undefined,
  })

  // Merge pending updates into cached todos at render time
  return useMemo(() => {
    let result = cachedTodos

    // Apply pending updates
    for (const update of pendingUpdates) {
      if (!update?.id) continue
      result = result.map(todo =>
        todo.id === update.id ? { ...todo, ...update } : todo
      )
    }

    // Apply pending toggles
    for (const todoId of pendingToggles) {
      if (!todoId) continue
      result = result.map(todo =>
        todo.id === todoId ? { ...todo, isComplete: !todo.isComplete } : todo
      )
    }

    return result
  }, [cachedTodos, pendingUpdates, pendingToggles])
}

/**
 * Hook that merges pending subtask mutations with cached subtasks at render time.
 * Similar to useOptimisticTodos but for subtasks within todos.
 */
export function useOptimisticSubtasks(cachedTodos: TodoWithRelations[]): TodoWithRelations[] {
  // Get all pending subtask update mutations
  const pendingSubtaskUpdates = useMutationState({
    filters: {
      predicate: (mutation) => {
        const key = mutation.options.mutationKey
        return Array.isArray(key) && key[0] === 'subtasks' && key[1] === 'update'
      },
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables as { id: string; name?: string; isComplete?: boolean } | undefined,
  })

  // Get all pending subtask toggle mutations
  const pendingSubtaskToggles = useMutationState({
    filters: {
      predicate: (mutation) => {
        const key = mutation.options.mutationKey
        return Array.isArray(key) && key[0] === 'subtasks' && key[1] === 'toggle'
      },
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables as string | undefined,
  })

  return useMemo(() => {
    let result = cachedTodos

    // Apply pending subtask updates
    for (const update of pendingSubtaskUpdates) {
      if (!update?.id) continue
      result = result.map(todo => ({
        ...todo,
        subtasks: todo.subtasks?.map((st: Subtask) =>
          st.id === update.id ? { ...st, ...update } : st
        ),
      }))
    }

    // Apply pending subtask toggles
    for (const subtaskId of pendingSubtaskToggles) {
      if (!subtaskId) continue
      result = result.map(todo => ({
        ...todo,
        subtasks: todo.subtasks?.map((st: Subtask) =>
          st.id === subtaskId ? { ...st, isComplete: !st.isComplete } : st
        ),
      }))
    }

    return result
  }, [cachedTodos, pendingSubtaskUpdates, pendingSubtaskToggles])
}

/**
 * Combined hook that applies both todo and subtask optimistic updates.
 * Use this in the dashboard to get todos with all pending changes applied.
 */
export function useOptimisticData(cachedTodos: TodoWithRelations[]): TodoWithRelations[] {
  const withTodoUpdates = useOptimisticTodos(cachedTodos)
  const withAllUpdates = useOptimisticSubtasks(withTodoUpdates)
  return withAllUpdates
}
