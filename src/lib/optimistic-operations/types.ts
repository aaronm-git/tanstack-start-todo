/**
 * Optimistic Operations Type Definitions
 * 
 * These types power the global optimistic update tracking system,
 * progress bar, and activity log.
 */

// Operation types that can be tracked
export type OperationType = 'create' | 'update' | 'delete'

// Entity types that can have operations performed on them
export type EntityType = 'todo' | 'subtask' | 'list' | 'ai-todo'

// Status of an optimistic operation
export type OperationStatus = 'pending' | 'success' | 'error'

/**
 * Represents a single optimistic operation being tracked
 */
export interface OptimisticOperation {
  /** Unique operation ID (typically mutation.state.submittedAt) */
  id: string
  /** Type of operation being performed */
  type: OperationType
  /** Type of entity being operated on */
  entityType: EntityType
  /** ID of the entity (null for create operations before ID assigned) */
  entityId: string | null
  /** Human-readable name for activity log display */
  entityName: string
  /** Current status of the operation */
  status: OperationStatus
  /** Current retry attempt (0 = first attempt) */
  retryCount: number
  /** Maximum number of retries allowed */
  maxRetries: number
  /** User-friendly error message (only set when status is 'error') */
  error?: string
  /** Sentry event ID for failed operations */
  sentryEventId?: string
  /** Timestamp when operation started */
  startedAt: number
  /** Timestamp when operation completed (success or final failure) */
  completedAt?: number
  /** Mutation variables for potential retry */
  variables: unknown
}

/**
 * Entry in the activity log, extends OptimisticOperation with display properties
 */
export interface ActivityLogEntry extends OptimisticOperation {
  /** Whether this entry is currently being retried */
  isRetrying: boolean
  /** Formatted relative time string (e.g., "2 minutes ago") */
  relativeTime?: string
}

/**
 * Metadata attached to mutations for tracking
 * This is stored in the mutation's `meta` field
 */
export interface MutationMeta extends Record<string, unknown> {
  /** Type of operation */
  operationType: OperationType
  /** Type of entity being operated on */
  entityType: EntityType
  /** Function to extract human-readable name from variables */
  getEntityName: (variables: unknown) => string
  /** Optional entity ID (for update/delete operations) */
  entityId?: string
  /** Optional timestamp to ensure consistency between entity updates and activity logs */
  timestamp?: number
}

/**
 * State shape for the OptimisticOperationsContext
 */
export interface OptimisticOperationsState {
  /** All operations currently being tracked */
  operations: OptimisticOperation[]
  /** Number of pending operations */
  pendingCount: number
  /** Whether any operations are currently pending */
  hasPendingOperations: boolean
  /** Whether the activity drawer is open */
  isDrawerOpen: boolean
  /** Activity log entries (sorted by most recent first) */
  activityLog: ActivityLogEntry[]
}

/**
 * Actions available from the OptimisticOperationsContext
 */
export interface OptimisticOperationsActions {
  /** Open the activity drawer */
  openDrawer: () => void
  /** Close the activity drawer */
  closeDrawer: () => void
  /** Toggle the activity drawer */
  toggleDrawer: () => void
  /** Store Sentry event ID for a failed operation */
  setSentryEventId: (operationId: string, eventId: string) => void
}

/**
 * Combined context value
 */
export interface OptimisticOperationsContextValue extends OptimisticOperationsState, OptimisticOperationsActions {}

/**
 * Progress bar state derived from operations
 */
export interface ProgressState {
  /** Current progress value (0-100) */
  value: number
  /** Whether progress bar should be visible */
  isVisible: boolean
  /** Whether we're in the completion animation phase */
  isCompleting: boolean
}

/**
 * Draft todo for placeholder mode (before persisted to DB)
 */
export interface DraftTodo {
  /** Temporary ID for the draft */
  tempId: string
  /** Todo name (starts empty) */
  name: string
  /** Description */
  description: string
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  /** Due date */
  dueDate: Date | null
  /** List ID */
  listId: string | null
  /** Whether the mutation has been triggered */
  isPersisting: boolean
  /** Timestamp when draft was created */
  createdAt: number
}

/**
 * Configuration for the progress animation
 */
export interface ProgressAnimationConfig {
  /** Initial progress value when operations start */
  initialValue: number
  /** Maximum progress value before completion */
  maxPendingValue: number
  /** Base time in ms for single operation to reach maxPendingValue */
  baseTime: number
  /** Additional time in ms added per concurrent operation */
  additionalTimePerOperation: number
  /** Time in ms for completion animation (100% then fade) */
  completionTime: number
}

/**
 * Default progress animation configuration
 */
export const DEFAULT_PROGRESS_CONFIG: ProgressAnimationConfig = {
  initialValue: 15,
  maxPendingValue: 85,
  baseTime: 2000,
  additionalTimePerOperation: 500,
  completionTime: 300,
}

/**
 * Activity log retention configuration
 */
export interface ActivityLogConfig {
  /** Maximum number of entries to keep in memory */
  maxEntries: number
  /** Time in ms to keep completed entries before cleanup */
  retentionTime: number
}

/**
 * Default activity log configuration
 */
export const DEFAULT_ACTIVITY_LOG_CONFIG: ActivityLogConfig = {
  maxEntries: 50,
  retentionTime: 5 * 60 * 1000, // 5 minutes
}
