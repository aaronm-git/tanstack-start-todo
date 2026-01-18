import { format } from 'date-fns'
import {
  Calendar,
  X,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { getPriorityColor, getPriorityLabel, isOverdue } from '../../lib/tasks'
import type { TodoWithRelations } from '../../lib/tasks'

interface TodoDetailPanelProps {
  todo: TodoWithRelations | null
  onClose: () => void
  onToggleComplete: (id: string) => void
  onEdit: (todo: TodoWithRelations) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
  onCategoryClick?: (categoryId: string) => void
  onEditSubtask?: (subtask: TodoWithRelations) => void
  onDeleteSubtask?: (id: string) => void
  className?: string
  hideCloseButton?: boolean
}

export function TodoDetailPanel({
  todo,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onCategoryClick,
  onEditSubtask,
  onDeleteSubtask,
  className,
  hideCloseButton = false,
}: TodoDetailPanelProps) {
  if (!todo) {
    return (
      <div className={cn('w-full lg:w-96 bg-muted/10 flex items-center justify-center', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select a todo to view details</p>
        </div>
      </div>
    )
  }

  const subtasks = todo.subtasks || []
  const completedSubtasks = subtasks.filter((st) => st.isComplete).length

  return (
    <div className={cn('w-full lg:w-96 bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b flex items-start justify-between gap-2 sticky top-0 bg-background z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={todo.isComplete}
              onCheckedChange={() => onToggleComplete(todo.id)}
            />
            <h2
              className={cn(
                'text-lg font-semibold flex-1',
                todo.isComplete && 'line-through text-muted-foreground',
              )}
            >
              {todo.name}
            </h2>
          </div>
          {todo.priority !== 'low' && (
            <Badge
              variant="secondary"
              className={cn('mb-2', getPriorityColor(todo.priority))}
            >
              {getPriorityLabel(todo.priority)}
            </Badge>
          )}
        </div>
        {!hideCloseButton && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 space-y-6">
          {/* Description */}
          {todo.description && (
            <div>
              <p
                className={cn(
                  'text-sm text-muted-foreground',
                  todo.isComplete && 'line-through',
                )}
              >
                {todo.description}
              </p>
            </div>
          )}

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Steps</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSubtask(todo.id)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Next step
              </Button>
            </div>

            {subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No steps yet. Add your first step to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={subtask.isComplete}
                      onCheckedChange={() => onToggleComplete(subtask.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-sm flex-1',
                            subtask.isComplete &&
                              'line-through text-muted-foreground',
                          )}
                        >
                          {subtask.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {subtask.priority !== 'low' && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                getPriorityColor(subtask.priority),
                              )}
                            >
                              {getPriorityLabel(subtask.priority)}
                            </Badge>
                          )}
                          {isOverdue(subtask.dueDate) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (onEditSubtask) {
                                    onEditSubtask(subtask)
                                  } else {
                                    onEdit(subtask)
                                  }
                                }}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  if (onDeleteSubtask) {
                                    onDeleteSubtask(subtask.id)
                                  } else {
                                    onDelete(subtask.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {subtask.description && (
                        <p
                          className={cn(
                            'text-xs text-muted-foreground',
                            subtask.isComplete && 'line-through',
                          )}
                        >
                          {subtask.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {completedSubtasks > 0 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    {completedSubtasks} of {subtasks.length} completed
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Categories */}
          {todo.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {todo.categories.map(({ category }) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    style={{
                      borderColor: category.color || undefined,
                      color: category.color || undefined,
                    }}
                    onClick={() => onCategoryClick?.(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          {todo.dueDate && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Due Date</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span
                  className={cn(
                    'text-sm',
                    isOverdue(todo.dueDate) && 'text-destructive',
                  )}
                >
                  {format(new Date(todo.dueDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit(todo)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Todo
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => onDelete(todo.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Todo
            </Button>
          </div>
        </div>
    </div>
  )
}
