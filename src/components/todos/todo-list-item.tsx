import { format } from 'date-fns'
import { Calendar, MoreVertical } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { getPriorityColor, getPriorityLabel, isOverdue } from '../../lib/tasks'
import type { TodoWithRelations } from '../../lib/tasks'

interface TodoListItemProps {
  todo: TodoWithRelations
  isSelected?: boolean
  onToggleComplete: (id: string) => void
  onSelect: (todo: TodoWithRelations) => void
  onEdit: (todo: TodoWithRelations) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
}

export function TodoListItem({
  todo,
  isSelected = false,
  onToggleComplete,
  onSelect,
  onEdit,
  onDelete,
  onAddSubtask,
}: TodoListItemProps) {
  const subtaskCount = todo.subtasks?.length || 0
  const completedSubtasks =
    todo.subtasks?.filter((st) => st.isComplete).length || 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b',
        isSelected && 'bg-accent',
        todo.isComplete && 'opacity-60',
      )}
      onClick={() => onSelect(todo)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={todo.isComplete}
        onCheckedChange={() => {
          onToggleComplete(todo.id)
        }}
        className="shrink-0"
      />

      {/* Title */}
      <h3
        className={cn(
          'text-sm font-medium flex-1 min-w-0 truncate',
          todo.isComplete && 'line-through text-muted-foreground',
        )}
      >
        {todo.name}
      </h3>

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
        {isOverdue(todo.dueDate) && (
          <Badge variant="destructive" className="text-xs shrink-0">
            Overdue
          </Badge>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onEdit(todo)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddSubtask(todo.id)}>
            Add Subtask
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(todo.id)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
