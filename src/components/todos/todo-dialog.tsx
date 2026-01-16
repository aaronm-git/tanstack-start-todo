import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { priorityLabels } from '../../lib/tasks'
import type { Priority, TodoWithRelations, CategoryWithCount } from '../../lib/tasks'

interface TodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TodoFormData) => void
  categories: CategoryWithCount[]
  todos?: TodoWithRelations[]
  editTodo?: TodoWithRelations | null
  parentId?: string | null
  isSubmitting?: boolean
}

export interface TodoFormData {
  name: string
  description: string
  priority: Priority
  dueDate: Date | null
  categoryIds: string[]
  parentId?: string | null
}

export function TodoDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  todos = [],
  editTodo,
  parentId,
  isSubmitting = false,
}: TodoDialogProps) {
  const [formData, setFormData] = useState<TodoFormData>({
    name: '',
    description: '',
    priority: 'low' as Priority,
    dueDate: null,
    categoryIds: [],
    parentId: parentId || null,
  })

  const [categoryOpen, setCategoryOpen] = useState(false)

  // Reset form when dialog opens/closes or editTodo changes
  useEffect(() => {
    if (open) {
      if (editTodo) {
        setFormData({
          name: editTodo.name,
          description: editTodo.description,
          priority: editTodo.priority,
          dueDate: editTodo.dueDate ? new Date(editTodo.dueDate) : null,
          categoryIds: editTodo.categories.map((c) => c.category.id),
          parentId: editTodo.parentId,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          priority: 'low' as Priority,
          dueDate: null,
          categoryIds: [],
          parentId: parentId || null,
        })
      }
    }
  }, [open, editTodo, parentId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }))
  }

  const selectedCategories = categories.filter((c) =>
    formData.categoryIds.includes(c.id),
  )

  // Filter out the current todo and its subtasks if editing (can't be its own parent)
  const availableParentTodos = editTodo
    ? todos.filter((t) => t.id !== editTodo.id && t.parentId !== editTodo.id)
    : todos

  const isSubtask = !!parentId || !!formData.parentId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTodo
              ? 'Edit Todo'
              : isSubtask
                ? 'Create Subtask'
                : 'Create New Todo'}
          </DialogTitle>
          <DialogDescription>
            {editTodo
              ? 'Update your todo details below.'
              : isSubtask
                ? 'Add a subtask to break down your work.'
                : 'Add a new todo to your list.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter todo name..."
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value as Priority }))
              }
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.dueDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate || undefined}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, dueDate: date || null }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} selected`
                      : 'Select categories...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => toggleCategory(category.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.categoryIds.includes(category.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: category.color || '#94a3b8',
                            }}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    style={{
                      borderColor: category.color || undefined,
                      color: category.color || undefined,
                    }}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Parent Todo (for creating subtask manually or editing) */}
          {!parentId && !isSubtask && availableParentTodos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Todo (Optional)</Label>
              <Select
                value={formData.parentId || '__none__'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentId: value === '__none__' ? null : value,
                  }))
                }
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="None (top-level todo)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top-level todo)</SelectItem>
                  {availableParentTodos.map((todo) => (
                    <SelectItem key={todo.id} value={todo.id}>
                      {todo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editTodo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
