/**
 * Optimistic Operations Module
 * 
 * Provides global tracking of React Query mutations with progress bar
 * and activity log functionality.
 */

// Types
export type {
  OperationType,
  EntityType,
  OperationStatus,
  OptimisticOperation,
  ActivityLogEntry,
  MutationMeta,
  OptimisticOperationsState,
  OptimisticOperationsActions,
  OptimisticOperationsContextValue,
  ProgressState,
  DraftTodo,
  ProgressAnimationConfig,
  ActivityLogConfig,
} from './types'

export {
  DEFAULT_PROGRESS_CONFIG,
  DEFAULT_ACTIVITY_LOG_CONFIG,
} from './types'

// Mutation Keys
export {
  mutationKeys,
  todoMutationKeys,
  subtaskMutationKeys,
  listMutationKeys,
  aiMutationKeys,
  allTrackedMutationsFilter,
  type MutationKeyArray,
} from './mutation-keys'

// Context and Hooks
export {
  OptimisticOperationsProvider,
  useOptimisticOperations,
  useOptimisticProgress,
  useActivityLog,
  useActivityDrawer,
} from './context'

// Sentry utilities
export {
  logMutationFailureToSentry,
  getFriendlyErrorMessage,
  startMutationSpan,
} from './sentry'

// Optimistic Data Hooks (Via the UI approach)
export {
  useOptimisticTodos,
  useOptimisticSubtasks,
  useOptimisticData,
} from './use-optimistic-todos'
