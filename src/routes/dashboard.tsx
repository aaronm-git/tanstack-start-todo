import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { Plus, LogOut, Sun, Moon, Monitor, Menu, Sparkles } from 'lucide-react'
import { useSession, signOut } from '../lib/auth-client'
import { useTheme } from '../components/theme-provider'
import { useIsMobile } from '../hooks/use-mobile'
import { Button, buttonVariants } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { toast } from 'sonner'

// Server functions
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete,
} from '../lib/server/todos'
import {
  getLists,
  createList,
  updateList,
  deleteList,
} from '../lib/server/categories'
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
  toggleSubtaskComplete,
} from '../lib/server/subtasks'

// Components
import { TodoList } from '../components/todos/todo-list'
import { Details } from '../components/details'
import { TodoDialog, type TodoFormData } from '../components/todos/todo-dialog'
import { SubtaskDialog } from '../components/todos/subtask-dialog'
import { AITodoDialog } from '../components/todos/ai-todo-dialog'
import { TodoFilters, type TodoFilters as TodoFiltersType } from '../components/todos/todo-filters'
import { Sidebar } from '../components/sidebar'
import { ListDialog, type ListFormData } from '../components/lists/list-dialog'

import type {
  TodoWithRelations,
  ListWithCount,
  CreateTodoInput,
  UpdateTodoInput,
  CreateListInput,
  UpdateListInput,
  Subtask,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from '../lib/tasks'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: session, isPending: sessionLoading } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()

  // State for dialogs
  const [todoDialogOpen, setTodoDialogOpen] = useState(false)
  const [aiTodoDialogOpen, setAiTodoDialogOpen] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoWithRelations | null>(null)
  const [editingList, setEditingList] = useState<ListWithCount | null>(null)
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false)
  const [todoIdForSubtask, setTodoIdForSubtask] = useState<string | null>(null)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<TodoWithRelations | null>(null)
  
  // Mobile sheet state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<TodoFiltersType>({
    search: '',
    priority: 'all',
    categoryId: null,
    status: 'all',
  })

  // Queries
  const {
    data: todos = [],
    isLoading: todosLoading,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: () => getTodos({}),
  })

  // Update selected todo when todos data changes
  useEffect(() => {
    if (selectedTodo && todos.length > 0) {
      const updatedTodo = todos.find((t) => t.id === selectedTodo.id)
      if (updatedTodo) {
        setSelectedTodo(updatedTodo)
      }
    }
  }, [todos, selectedTodo?.id])

  const {
    data: lists = [],
    isLoading: listsLoading,
  } = useQuery({
    queryKey: ['lists'],
    queryFn: () => getLists({}),
  })

  // Mutations with optimistic updates
  const createTodoMutation = useMutation({
    mutationFn: (data: CreateTodoInput) => createTodo({ data }),
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData(['todos'])
      
      // Optimistically update - create partial object for optimistic UI
      const optimisticTodo = {
        id: `temp-${Date.now()}`,
        name: newTodo.name,
        description: newTodo.description ?? '',
        priority: newTodo.priority ?? 'low',
        isComplete: false,
        dueDate: newTodo.dueDate ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        list: newTodo.listId ? lists.find((c) => c.id === newTodo.listId) || null : null,
        subtasks: [],
      }
      
      queryClient.setQueryData(['todos'], (old: typeof todos = []) => [
        ...old,
        optimisticTodo,
      ])
      
      return { previousTodos }
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to create todo')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('Todo created successfully')
      setTodoDialogOpen(false)
      setEditingTodo(null)
    },
  })

  const updateTodoMutation = useMutation({
    mutationFn: (data: UpdateTodoInput) => updateTodo({ data }),
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData(['todos'])
      
      queryClient.setQueryData(['todos'], (old: typeof todos = []) =>
        old.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
        )
      )
      
      return { previousTodos }
    },
    onError: (_err, _updatedTodo, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to update todo')
    },
    onSuccess: (updatedTodo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      // Update selected todo if it was the one being edited
      if (selectedTodo && updatedTodo && selectedTodo.id === updatedTodo.id) {
        setSelectedTodo(updatedTodo)
      }
      toast.success('Todo updated successfully')
      setTodoDialogOpen(false)
      setEditingTodo(null)
    },
  })

  const toggleCompleteMutation = useMutation({
    mutationFn: (id: string) => toggleTodoComplete({ data: id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData(['todos'])
      
      queryClient.setQueryData(['todos'], (old: typeof todos = []) =>
        old.map((todo) =>
          todo.id === id ? { ...todo, isComplete: !todo.isComplete } : todo
        )
      )
      
      // Also update selectedTodo if it's the one being toggled
      if (selectedTodo && selectedTodo.id === id) {
        setSelectedTodo({ ...selectedTodo, isComplete: !selectedTodo.isComplete })
      }
      
      return { previousTodos }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to update todo status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => deleteTodo({ data: id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData(['todos'])
      
      queryClient.setQueryData(['todos'], (old: typeof todos = []) =>
        old.filter((todo) => todo.id !== id)
      )
      
      return { previousTodos }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to delete todo')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      // Clear selected todo if it was deleted
      if (selectedTodo && todoToDelete === selectedTodo.id) {
        setSelectedTodo(null)
      }
      toast.success('Todo deleted successfully')
    },
  })

  const createListMutation = useMutation({
    mutationFn: (data: CreateListInput) => createList({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List created successfully')
      setListDialogOpen(false)
      setEditingList(null)
    },
    onError: () => {
      toast.error('Failed to create list')
    },
  })

  const updateListMutation = useMutation({
    mutationFn: (data: UpdateListInput) => updateList({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast.success('List updated successfully')
      setListDialogOpen(false)
      setEditingList(null)
    },
    onError: () => {
      toast.error('Failed to update list')
    },
  })

  const deleteListMutation = useMutation({
    mutationFn: (id: string) => deleteList({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('List deleted successfully')
      if (filters.categoryId) {
        setFilters((prev) => ({ ...prev, categoryId: null }))
      }
    },
    onError: () => {
      toast.error('Failed to delete list')
    },
  })

  // Subtask mutations
  const createSubtaskMutation = useMutation({
    mutationFn: (data: CreateSubtaskInput) => createSubtask({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('Subtask created successfully')
      setSubtaskDialogOpen(false)
      setEditingSubtask(null)
      setTodoIdForSubtask(null)
    },
    onError: () => {
      toast.error('Failed to create subtask')
    },
  })

  const updateSubtaskMutation = useMutation({
    mutationFn: (data: UpdateSubtaskInput) => updateSubtask({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('Subtask updated successfully')
      setSubtaskDialogOpen(false)
      setEditingSubtask(null)
    },
    onError: () => {
      toast.error('Failed to update subtask')
    },
  })

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id: string) => deleteSubtask({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('Subtask deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete subtask')
    },
  })

  const toggleSubtaskCompleteMutation = useMutation({
    mutationFn: (id: string) => toggleSubtaskComplete({ data: id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData(['todos'])
      
      // Optimistically update subtasks within todos
      queryClient.setQueryData(['todos'], (old: typeof todos = []) =>
        old.map((todo) => {
          if (todo.subtasks && todo.subtasks.length > 0) {
            const hasMatchingSubtask = todo.subtasks.some((st: Subtask) => st.id === id)
            if (hasMatchingSubtask) {
              const updatedSubtasks = todo.subtasks.map((subtask: Subtask) =>
                subtask.id === id
                  ? { ...subtask, isComplete: !subtask.isComplete }
                  : subtask
              )
              return { ...todo, subtasks: updatedSubtasks }
            }
          }
          return todo
        })
      )
      
      // Also update selectedTodo if it contains the subtask
      if (selectedTodo && selectedTodo.subtasks) {
        const hasMatchingSubtask = selectedTodo.subtasks.some((st: Subtask) => st.id === id)
        if (hasMatchingSubtask) {
          const updatedSubtasks = selectedTodo.subtasks.map((subtask: Subtask) =>
            subtask.id === id
              ? { ...subtask, isComplete: !subtask.isComplete }
              : subtask
          )
          setSelectedTodo({ ...selectedTodo, subtasks: updatedSubtasks })
        }
      }
      
      return { previousTodos }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to update subtask status')
    },
    onSuccess: () => {
      // Don't invalidate to preserve order
    },
  })

  // Handlers
  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  const handleCreateTodo = () => {
    setEditingTodo(null)
    setTodoDialogOpen(true)
  }

  const handleAICreateTodo = () => {
    setAiTodoDialogOpen(true)
  }

  const handleAITodoSuccess = (todo: TodoWithRelations) => {
    // Refresh the queries and select the new todo
    queryClient.invalidateQueries({ queryKey: ['todos'] })
    queryClient.invalidateQueries({ queryKey: ['lists'] })
    setSelectedTodo(todo)
    if (isMobile) {
      setDetailsOpen(true)
    }
  }

  const handleSelectTodo = (todo: TodoWithRelations) => {
    setSelectedTodo(todo)
    if (isMobile) {
      setDetailsOpen(true)
    }
  }

  const handleEditTodo = (todo: TodoWithRelations) => {
    setEditingTodo(todo)
    setTodoDialogOpen(true)
  }

  const handleAddSubtask = (todoId: string) => {
    setEditingSubtask(null)
    setTodoIdForSubtask(todoId)
    setSubtaskDialogOpen(true)
  }

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask)
    setTodoIdForSubtask(subtask.todoId)
    setSubtaskDialogOpen(true)
  }

  const handleDeleteSubtask = (id: string) => {
    deleteSubtaskMutation.mutate(id)
  }

  const handleSubtaskSubmit = (name: string) => {
    if (editingSubtask) {
      updateSubtaskMutation.mutate({
        id: editingSubtask.id,
        name,
      })
    } else if (todoIdForSubtask) {
      createSubtaskMutation.mutate({
        name,
        todoId: todoIdForSubtask,
      })
    }
  }

  const handleTodoSubmit = (data: TodoFormData) => {
    if (editingTodo) {
      updateTodoMutation.mutate({ id: editingTodo.id, ...data })
    } else {
      createTodoMutation.mutate(data)
    }
  }

  const handleCloseDetails = () => {
    setSelectedTodo(null)
    setDetailsOpen(false)
  }

  const handleDeleteTodo = (id: string) => {
    setTodoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (todoToDelete) {
      deleteTodoMutation.mutate(todoToDelete)
      setDeleteDialogOpen(false)
      setTodoToDelete(null)
    }
  }

  // Check if the todo being deleted has subtasks
  const todoToDeleteData = todos.find((t) => t.id === todoToDelete)
  const hasSubtasks = (todoToDeleteData?.subtasks?.length ?? 0) > 0

  const handleCreateList = () => {
    setEditingList(null)
    setListDialogOpen(true)
  }

  const handleEditList = (list: ListWithCount) => {
    setEditingList(list)
    setListDialogOpen(true)
  }

  const handleListSubmit = (data: ListFormData) => {
    if (editingList) {
      updateListMutation.mutate({ id: editingList.id, ...data })
    } else {
      createListMutation.mutate(data)
    }
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setFilters((prev) => ({ ...prev, categoryId }))
  }

  const handleCategoryClick = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? null : categoryId,
    }))
  }

  // Filter todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (
          !todo.name.toLowerCase().includes(searchLower) &&
          !todo.description.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // Priority filter
      if (filters.priority !== 'all' && todo.priority !== filters.priority) {
        return false
      }

      // Category filter (now using list)
      if (filters.categoryId) {
        const hasList = todo.list?.id === filters.categoryId
        if (!hasList) return false
      }

      // Status filter
      if (filters.status === 'active' && todo.isComplete) return false
      if (filters.status === 'completed' && !todo.isComplete) return false

      return true
    })
  }, [todos, filters])

  // Auth check
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    navigate({ to: '/login' })
    return null
  }

  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : session.user.email?.[0]?.toUpperCase() || 'U'

  // Sidebar content component (reused in desktop and mobile)
  const sidebarContent = (
    <Sidebar
      categories={lists}
      selectedCategoryId={filters.categoryId}
      onCategorySelect={(id) => {
        handleCategorySelect(id)
        if (isMobile) setSidebarOpen(false)
      }}
      onCreateCategory={handleCreateList}
      onEditCategory={handleEditList}
      onDeleteCategory={(id) => deleteListMutation.mutate(id)}
      totalTodos={todos.length}
      isLoading={listsLoading}
    />
  )

  // Details content component (reused in desktop and mobile)
  const detailsContent = (hideClose = false) => (
    <Details
      todo={selectedTodo}
      onClose={handleCloseDetails}
      onToggleComplete={(id) => toggleCompleteMutation.mutate(id)}
      onEdit={handleEditTodo}
      onDelete={handleDeleteTodo}
      onAddSubtask={handleAddSubtask}
      onCategoryClick={handleCategoryClick}
      onEditSubtask={handleEditSubtask}
      onDeleteSubtask={handleDeleteSubtask}
      onToggleSubtaskComplete={(id) => toggleSubtaskCompleteMutation.mutate(id)}
      hideCloseButton={hideClose}
    />
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-muted/10 flex-col h-full overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Categories</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Column - Todo List */}
      <div className="flex-1 flex flex-col lg:border-r h-full overflow-hidden">
        {/* Header */}
        <header className="border-b px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold truncate">
                {filters.categoryId
                  ? lists.find((c) => c.id === filters.categoryId)?.name || 'Todos'
                  : 'My Todos'}
              </h1>
              <Badge variant="secondary" className="text-xs shrink-0">
                {filteredTodos.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAICreateTodo} size="sm" variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Create</span>
              </Button>
              <Button onClick={handleCreateTodo} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Todo</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Theme
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Filters */}
          <div className="pb-3">
            <TodoFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={todos.length}
              filteredCount={filteredTodos.length}
            />
          </div>
        </header>

        {/* Todo List */}
        <main className="flex-1 overflow-y-auto pb-10">
          <TodoList
            todos={filteredTodos}
            selectedTodoId={selectedTodo?.id || null}
            isLoading={todosLoading}
            onToggleComplete={(id) => toggleCompleteMutation.mutate(id)}
            onSelectTodo={handleSelectTodo}
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
            onAddSubtask={handleAddSubtask}
          />
        </main>
      </div>

      {/* Desktop Details */}
      <div className="hidden lg:flex h-full overflow-y-auto">
        {detailsContent(false)}
      </div>

      {/* Mobile Details Sheet */}
      <Sheet open={detailsOpen && isMobile} onOpenChange={(open) => {
        setDetailsOpen(open)
        if (!open) setSelectedTodo(null)
      }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Todo Details</SheetTitle>
          </SheetHeader>
          {detailsContent(true)}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <TodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSubmit={handleTodoSubmit}
        categories={lists}
        editTodo={editingTodo}
        isSubmitting={
          createTodoMutation.isPending || updateTodoMutation.isPending
        }
      />

      <SubtaskDialog
        open={subtaskDialogOpen}
        onOpenChange={setSubtaskDialogOpen}
        onSubmit={handleSubtaskSubmit}
        editSubtask={editingSubtask}
        isSubmitting={
          createSubtaskMutation.isPending || updateSubtaskMutation.isPending
        }
      />

      <AITodoDialog
        open={aiTodoDialogOpen}
        onOpenChange={setAiTodoDialogOpen}
        onSuccess={handleAITodoSuccess}
        categories={lists}
      />

      <ListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onSubmit={handleListSubmit}
        editList={editingList}
        isSubmitting={
          createListMutation.isPending || updateListMutation.isPending
        }
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
            <AlertDialogDescription>
              {hasSubtasks
                ? 'Are you sure you want to delete this todo? This will also delete all subtasks. This action cannot be undone.'
                : 'Are you sure you want to delete this todo? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
