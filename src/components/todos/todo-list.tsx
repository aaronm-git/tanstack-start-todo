import { TodoListItem } from './todo-list-item'
import { AILoadingTodo as AILoadingTodoComponent } from './ai-loading-todo'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../ui/empty'
import { Skeleton } from '../ui/skeleton'
import type { TodoWithRelations } from '../../lib/tasks'
import type { DraftTodo } from '../../lib/optimistic-operations'
import { Circle } from 'lucide-react'

export interface AILoadingTodoState {
  tempId: string
  prompt: string
  resolvedTodo?: TodoWithRelations | null
  isLoading: boolean
}

interface TodoListProps {
  todos: TodoWithRelations[]
  selectedTodoId: string | null
  isLoading?: boolean
  draft?: DraftTodo | null
  aiLoadingTodos?: AILoadingTodoState[]
  onToggleComplete: (id: string) => void
  onSelectTodo: (todo: TodoWithRelations) => void
  onUpdateName: (id: string, name: string) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string) => void
  onCancelDraft?: () => void
  onDraftNameChange?: (name: string) => void
}

export function TodoList({
  todos,
  selectedTodoId,
  isLoading,
  draft,
  aiLoadingTodos = [],
  onToggleComplete,
  onSelectTodo,
  onUpdateName,
  onDelete,
  onAddSubtask,
  onCancelDraft,
  onDraftNameChange,
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

  // Create draft todo object for rendering
  const draftTodo: TodoWithRelations | null = draft ? {
    id: draft.tempId,
    name: draft.name,
    description: draft.description,
    priority: draft.priority,
    isComplete: false,
    dueDate: draft.dueDate,
    createdAt: new Date(draft.createdAt),
    updatedAt: new Date(draft.createdAt),
    list: null,
    subtasks: [],
  } : null

  const hasTodos = todos.length > 0 || draftTodo || aiLoadingTodos.length > 0

  if (!hasTodos) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Circle className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No todos found</EmptyTitle>
            <EmptyDescription>Create your first todo to get started!</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {/* AI Loading todos at the top */}
      {aiLoadingTodos.map((aiTodo) => (
        <AILoadingTodoComponent
          key={aiTodo.tempId}
          tempId={aiTodo.tempId}
          prompt={aiTodo.prompt}
          resolvedTodo={aiTodo.resolvedTodo}
          isLoading={aiTodo.isLoading}
          onSelect={onSelectTodo}
          onToggleComplete={onToggleComplete}
          onUpdateName={onUpdateName}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}

      {/* Draft todo */}
      {draftTodo && (
        <TodoListItem
          key={draftTodo.id}
          todo={draftTodo}
          isSelected={selectedTodoId === draftTodo.id}
          isDraft={true}
          autoFocusName={true}
          onToggleComplete={() => {}}
          onSelect={onSelectTodo}
          onUpdateName={(_, name) => onDraftNameChange?.(name)}
          onDelete={() => onCancelDraft?.()}
          onAddSubtask={() => {}}
          onCancelDraft={onCancelDraft}
        />
      )}
      
      {/* Regular todos */}
      {todos.map((todo) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          isSelected={selectedTodoId === todo.id}
          onToggleComplete={onToggleComplete}
          onSelect={onSelectTodo}
          onUpdateName={onUpdateName}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  )
}
