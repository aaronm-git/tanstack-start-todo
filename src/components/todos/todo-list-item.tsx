import { useCallback, memo } from 'react'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { EditableInput } from '../ui/editable-input'
import { cn } from '../../lib/utils'
import { getPriorityColor, getPriorityLabel, isOverdue } from '../../lib/tasks'
import type { TodoWithRelations, Subtask } from '../../lib/tasks'

interface TodoListItemProps {
  todo: TodoWithRelations
  isSelected?: boolean
  isDraft?: boolean
  autoFocusName?: boolean
  onToggleComplete: (id: string) => void
  onSelect: (todo: TodoWithRelations) => void
  onUpdateName: (id: string, name: string) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
  onCancelDraft?: () => void
}

/**
 * Memoized todo list item to prevent unnecessary re-renders during inline editing.
 * Uses custom comparison to only re-render when meaningful data changes.
 */
export const TodoListItem = memo(function TodoListItem({
  todo,
  isSelected = false,
  isDraft = false,
  autoFocusName = false,
  onToggleComplete,
  onSelect,
  onUpdateName,
  onDelete,
  onAddSubtask,
  onCancelDraft,
}: TodoListItemProps) {
  const subtaskCount = todo.subtasks?.length || 0
  const completedSubtasks =
    todo.subtasks?.filter((st: Subtask) => st.isComplete).length || 0

  // Handle name save
  const handleNameSave = useCallback((name: string) => {
    if (isDraft && !name.trim()) {
      // If draft and name is empty, cancel the draft
      onCancelDraft?.()
      return
    }
    if (name.trim() && name !== todo.name) {
      onUpdateName(todo.id, name)
    }
  }, [isDraft, onCancelDraft, onUpdateName, todo.id, todo.name])

  // Handle row click - select the todo
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    // Don't select if clicking on editable input
    const target = e.target as HTMLElement
    if (target.closest('[data-editable-container]')) {
      return
    }
    onSelect(todo)
  }, [onSelect, todo])

  // Handle edit start - select the todo when user starts editing
  const handleEditStart = useCallback(() => {
    onSelect(todo)
  }, [onSelect, todo])

  // Handle cancel for draft mode
  const handleCancel = useCallback(() => {
    if (isDraft) {
      onCancelDraft?.()
    }
  }, [isDraft, onCancelDraft])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b',
        isSelected && 'bg-accent',
        todo.isComplete && 'opacity-60',
        isDraft && 'bg-primary/5 border-primary/20',
      )}
      onClick={handleRowClick}
    >
      {/* Checkbox */}
      <Checkbox
        checked={todo.isComplete}
        onCheckedChange={() => {
          if (!isDraft) {
            onToggleComplete(todo.id)
          }
        }}
        disabled={isDraft}
        className="shrink-0"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Editable Title */}
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <EditableInput
          value={todo.name}
          onSave={handleNameSave}
          placeholder="Enter task name..."
          autoFocus={autoFocusName}
          onCancel={handleCancel}
          onEditStart={handleEditStart}
          required={!isDraft}
          className="w-full"
          textClassName={cn(
            'text-sm font-medium truncate',
            todo.isComplete && 'line-through text-muted-foreground',
          )}
          inputClassName="text-sm font-medium"
          aria-label="Task name"
        />
      </div>

      {/* Meta info - all in one row */}
      <div className="flex items-center gap-2 shrink-0">
        {subtaskCount > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedSubtasks} of {subtaskCount}
          </span>
        )}
        {todo.dueDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            {format(new Date(todo.dueDate), 'MMM d')}
          </span>
        )}
        {todo.priority !== 'low' && (
          <Badge
            variant="secondary"
            className={cn('text-xs shrink-0', getPriorityColor(todo.priority))}
          >
            {getPriorityLabel(todo.priority)}
          </Badge>
        )}
        {isOverdue(todo.dueDate) && !isDraft && (
          <Badge variant="destructive" className="text-xs shrink-0">
            Overdue
          </Badge>
        )}
      </div>
    </div>
  )
})
