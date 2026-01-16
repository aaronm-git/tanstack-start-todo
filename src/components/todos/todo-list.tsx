import { TodoListItem } from './todo-list-item'
import { Empty } from '../ui/empty'
import { Skeleton } from '../ui/skeleton'
import type { TodoWithRelations } from '../../lib/tasks'
import { Circle } from 'lucide-react'

interface TodoListProps {
  todos: TodoWithRelations[]
  selectedTodoId: string | null
  isLoading?: boolean
  onToggleComplete: (id: string) => void
  onSelectTodo: (todo: TodoWithRelations) => void
  onEdit: (todo: TodoWithRelations) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
}

export function TodoList({
  todos,
  selectedTodoId,
  isLoading,
  onToggleComplete,
  onSelectTodo,
  onEdit,
  onDelete,
  onAddSubtask,
}: TodoListProps) {
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          title="No todos found"
          description="Create your first todo to get started!"
          icon={<Circle className="h-12 w-12 text-muted-foreground" />}
        />
      </div>
    )
  }

  return (
    <div className="divide-y">
      {todos.map((todo) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          isSelected={selectedTodoId === todo.id}
          onToggleComplete={onToggleComplete}
          onSelect={onSelectTodo}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  )
}
