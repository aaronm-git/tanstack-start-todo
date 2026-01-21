import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../../lib/utils'
import type { TodoWithRelations } from '../../lib/tasks'
import { TodoListItem } from './todo-list-item'

interface AILoadingTodoProps {
  tempId: string
  prompt: string
  /** The actual todo data once received from the server */
  resolvedTodo?: TodoWithRelations | null
  /** Whether the AI generation is still in progress */
  isLoading: boolean
  className?: string
  onSelect: (todo: TodoWithRelations) => void
  onToggleComplete: (id: string) => void
  onUpdateName: (id: string, name: string) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
}

/**
 * AI-generated todo with overlay animation.
 * Shows a rainbow shimmer overlay while generating, then fades out to reveal the actual todo.
 */
export function AILoadingTodo({
  tempId,
  prompt,
  resolvedTodo,
  isLoading,
  className,
  onSelect,
  onToggleComplete,
  onUpdateName,
  onDelete,
  onAddSubtask,
}: AILoadingTodoProps) {
  // Placeholder todo structure (used when no resolved data yet)
  const placeholderTodo: TodoWithRelations = resolvedTodo || {
    id: tempId,
    name: prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt,
    description: '',
    priority: 'low',
    isComplete: false,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    list: null,
    subtasks: [],
    // Add any additional required fields with defaults
    recurrenceType: null,
    recurrenceConfig: null,
    recurringTodoId: null,
    nextOccurrence: null,
    userId: '',
    listId: null,
  }

  return (
    <div className={cn('relative', className)}>
      {/* The actual todo item underneath (visible when overlay fades) */}
      <div className={cn(isLoading && 'invisible')}>
        <TodoListItem
          todo={placeholderTodo}
          isSelected={false}
          onToggleComplete={onToggleComplete}
          onSelect={onSelect}
          onUpdateName={onUpdateName}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      </div>

      {/* AI Loading overlay - fades out when data arrives */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center gap-3 px-4 py-3 border-b overflow-hidden bg-background"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-purple-500/5 to-primary/5" />

            {/* Rainbow shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Rainbow border shimmer - top */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 0', '200% 0'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Rainbow border shimmer - bottom */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #7b68ee, #40e0d0, #ff8c00, #ff0080, #7b68ee)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['200% 0', '0% 0'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Content - matches todo list item structure exactly */}
            <div className="relative z-10 flex items-center gap-3 w-full">
              {/* Checkbox placeholder */}
              <Checkbox disabled className="shrink-0 opacity-50" />

              {/* Text with sparkle */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}
                </span>
              </div>

              {/* AI badge */}
              <motion.div
                className="shrink-0 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
