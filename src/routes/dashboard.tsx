import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { Plus, LogOut, Sun, Moon, Monitor, Menu } from 'lucide-react'
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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../lib/server/categories'

// Components
import { TodoList } from '../components/todos/todo-list'
import { TodoDetailPanel } from '../components/todos/todo-detail-panel'
import { TodoDialog, type TodoFormData } from '../components/todos/todo-dialog'
import { TodoFilters, type TodoFilters as TodoFiltersType } from '../components/todos/todo-filters'
import { CategorySidebar } from '../components/categories/category-sidebar'
import { CategoryDialog, type CategoryFormData } from '../components/categories/category-dialog'

import type {
  TodoWithRelations,
  CategoryWithCount,
  CreateTodoInput,
  UpdateTodoInput,
  CreateCategoryInput,
  UpdateCategoryInput,
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
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoWithRelations | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [parentIdForSubtask, setParentIdForSubtask] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<TodoWithRelations | null>(null)
  
  // Mobile sheet state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)

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
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({}),
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
        parentId: newTodo.parentId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: (newTodo.categoryIds ?? []).map((id) => ({
          todoId: `temp-${Date.now()}`,
          categoryId: id,
          category: categories.find((c) => c.id === id)!,
        })),
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Todo created successfully')
      setTodoDialogOpen(false)
      setEditingTodo(null)
      setParentIdForSubtask(null)
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
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
      
      return { previousTodos }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
      toast.error('Failed to update todo status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      // Refresh selected todo if it was toggled
      if (selectedTodo) {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
      }
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
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Clear selected todo if it was deleted
      if (selectedTodo && todoToDelete === selectedTodo.id) {
        setSelectedTodo(null)
      }
      toast.success('Todo deleted successfully')
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully')
      setCategoryDialogOpen(false)
      setEditingCategory(null)
    },
    onError: () => {
      toast.error('Failed to create category')
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: (data: UpdateCategoryInput) => updateCategory({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated successfully')
      setCategoryDialogOpen(false)
      setEditingCategory(null)
    },
    onError: () => {
      toast.error('Failed to update category')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('Category deleted successfully')
      if (filters.categoryId) {
        setFilters((prev) => ({ ...prev, categoryId: null }))
      }
    },
    onError: () => {
      toast.error('Failed to delete category')
    },
  })

  // Handlers
  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  const handleCreateTodo = () => {
    setEditingTodo(null)
    setParentIdForSubtask(null)
    setTodoDialogOpen(true)
  }

  const handleSelectTodo = (todo: TodoWithRelations) => {
    setSelectedTodo(todo)
    if (isMobile) {
      setDetailPanelOpen(true)
    }
  }

  const handleEditTodo = (todo: TodoWithRelations) => {
    setEditingTodo(todo)
    setParentIdForSubtask(null)
    setTodoDialogOpen(true)
  }

  const handleAddSubtask = (parentId: string) => {
    setEditingTodo(null)
    setParentIdForSubtask(parentId)
    setTodoDialogOpen(true)
  }

  const handleTodoSubmit = (data: TodoFormData) => {
    if (editingTodo) {
      updateTodoMutation.mutate({ id: editingTodo.id, ...data })
    } else {
      createTodoMutation.mutate(data)
    }
  }

  const handleCloseDetailPanel = () => {
    setSelectedTodo(null)
    setDetailPanelOpen(false)
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

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: CategoryWithCount) => {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...data })
    } else {
      createCategoryMutation.mutate(data)
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

      // Category filter
      if (filters.categoryId) {
        const hasCategory = todo.categories.some(
          (c) => c.category.id === filters.categoryId
        )
        if (!hasCategory) return false
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
    <CategorySidebar
      categories={categories}
      selectedCategoryId={filters.categoryId}
      onCategorySelect={(id) => {
        handleCategorySelect(id)
        if (isMobile) setSidebarOpen(false)
      }}
      onCreateCategory={handleCreateCategory}
      onEditCategory={handleEditCategory}
      onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
      totalTodos={todos.length}
      isLoading={categoriesLoading}
    />
  )

  // Detail panel content component (reused in desktop and mobile)
  const detailPanelContent = (hideClose = false) => (
    <TodoDetailPanel
      todo={selectedTodo}
      onClose={handleCloseDetailPanel}
      onToggleComplete={(id) => toggleCompleteMutation.mutate(id)}
      onEdit={handleEditTodo}
      onDelete={handleDeleteTodo}
      onAddSubtask={handleAddSubtask}
      onCategoryClick={handleCategoryClick}
      onEditSubtask={handleEditTodo}
      onDeleteSubtask={handleDeleteTodo}
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
                  ? categories.find((c) => c.id === filters.categoryId)?.name || 'Todos'
                  : 'My Todos'}
              </h1>
              <Badge variant="secondary" className="text-xs shrink-0">
                {filteredTodos.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
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
        <main className="flex-1 overflow-y-auto">
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

      {/* Desktop Detail Panel */}
      <div className="hidden lg:flex h-full overflow-y-auto">
        {detailPanelContent(false)}
      </div>

      {/* Mobile Detail Panel Sheet */}
      <Sheet open={detailPanelOpen && isMobile} onOpenChange={(open) => {
        setDetailPanelOpen(open)
        if (!open) setSelectedTodo(null)
      }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Todo Details</SheetTitle>
          </SheetHeader>
          {detailPanelContent(true)}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <TodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSubmit={handleTodoSubmit}
        categories={categories}
        todos={todos}
        editTodo={editingTodo}
        parentId={parentIdForSubtask}
        isSubmitting={
          createTodoMutation.isPending || updateTodoMutation.isPending
        }
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSubmit={handleCategorySubmit}
        editCategory={editingCategory}
        isSubmitting={
          createCategoryMutation.isPending || updateCategoryMutation.isPending
        }
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this todo? This will also delete all
              subtasks. This action cannot be undone.
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
