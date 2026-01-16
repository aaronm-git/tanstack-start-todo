import { format } from 'date-fns'
import {
  MoreVertical,
  Trash2,
  Edit,
  Plus,
  Calendar,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import { cn } from '../../lib/utils'
import { priorityColors, getPriorityLabel } from '../../lib/tasks'
import type { TodoWithRelations } from '../../lib/tasks'

interface TodoCardProps {
  todo: TodoWithRelations
  onToggleComplete: (id: string) => void
  onEdit: (todo: TodoWithRelations) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
  onCategoryClick?: (categoryId: string) => void
  level?: number
}

export function TodoCard({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onCategoryClick,
  level = 0,
}: TodoCardProps) {
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        todo.isComplete && 'opacity-60',
        level > 0 && 'ml-6 border-l-2',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={todo.isComplete}
            onCheckedChange={() => onToggleComplete(todo.id)}
            className="mt-1"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Priority */}
            <div className="flex items-start gap-2 mb-2">
              <h3
                className={cn(
                  'text-base font-semibold flex-1',
                  todo.isComplete && 'line-through text-muted-foreground',
                )}
              >
                {todo.name}
              </h3>
              <Badge variant="secondary" className={cn(priorityColors[todo.priority])}>
                {getPriorityLabel(todo.priority)}
              </Badge>
            </div>

            {/* Description */}
            {todo.description && (
              <p
                className={cn(
                  'text-sm text-muted-foreground mb-2',
                  todo.isComplete && 'line-through',
                )}
              >
                {todo.description}
              </p>
            )}

            {/* Categories and Due Date */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Categories */}
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

              {/* Due Date */}
              {todo.dueDate && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>

            {/* Subtasks */}
            {hasSubtasks && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="subtasks" className="border-none">
                  <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                    <span className="flex items-center gap-2">
                      {todo.subtasks?.length ?? 0}{' '}
                      {(todo.subtasks?.length ?? 0) === 1 ? 'subtask' : 'subtasks'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-2">
                    <div className="space-y-2">
                      {(todo.subtasks ?? []).map((subtask) => (
                        <TodoCard
                          key={subtask.id}
                          todo={subtask}
                          onToggleComplete={onToggleComplete}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onAddSubtask={onAddSubtask}
                          onCategoryClick={onCategoryClick}
                          level={level + 1}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubtask(todo.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subtask
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(todo.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
