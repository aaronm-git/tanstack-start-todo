import { Plus, Edit, Trash2, Folder, MoreVertical } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { cn } from '../../lib/utils'
import type { CategoryWithCount } from '../../lib/tasks'
import { useState } from 'react'

interface CategorySidebarProps {
  categories: CategoryWithCount[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string | null) => void
  onCreateCategory: () => void
  onEditCategory: (category: CategoryWithCount) => void
  onDeleteCategory: (categoryId: string) => void
  totalTodos: number
  isLoading?: boolean
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  totalTodos,
  isLoading,
}: CategorySidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(
    null,
  )

  const handleDeleteClick = (category: CategoryWithCount) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Header */}
        <div className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onCreateCategory}
              className="hidden lg:flex"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* All Todos */}
        <div className="p-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              selectedCategoryId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent',
            )}
          >
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>All Todos</span>
            </div>
            <Badge
              variant={selectedCategoryId === null ? 'secondary' : 'outline'}
            >
              {totalTodos}
            </Badge>
          </button>
        </div>

        <Separator />

        {/* Categories List */}
        <div className="px-2">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No categories yet
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateCategory}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create one
              </Button>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                    selectedCategoryId === category.id
                      ? 'bg-accent'
                      : 'hover:bg-accent/50',
                  )}
                >
                  <button
                    onClick={() => onCategorySelect(category.id)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: category.color || '#94a3b8',
                      }}
                    />
                    <span className="text-sm truncate flex-1">
                      {category.name}
                    </span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {category.todoCount}
                    </Badge>
                  </button>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditCategory(category)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(category)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This
              will remove the category from all todos, but won't delete the todos
              themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
