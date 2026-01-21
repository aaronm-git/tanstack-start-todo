import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { priorityLabels, type Priority } from '../../lib/tasks'
import type { TodoWithRelations, ListWithCount } from '../../lib/tasks'

// Default priority value
const DEFAULT_PRIORITY: Priority = 'low'

// Type guard for Priority values
function isPriority(value: string): value is Priority {
  return value in priorityLabels
}

interface TodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TodoFormData) => void
  categories: ListWithCount[]
  editTodo?: TodoWithRelations | null
  isSubmitting?: boolean
}

export interface TodoFormData {
  name: string
  description: string
  priority: Priority
  dueDate: Date | null
  listId: string | null
}

export function TodoDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  editTodo,
  isSubmitting = false,
}: TodoDialogProps) {
  const [formData, setFormData] = useState<TodoFormData>({
    name: '',
    description: '',
    priority: DEFAULT_PRIORITY,
    dueDate: null,
    listId: null,
  })

  // Reset form when dialog opens/closes or editTodo changes
  useEffect(() => {
    if (open) {
      if (editTodo) {
        setFormData({
          name: editTodo.name,
          description: editTodo.description,
          priority: editTodo.priority,
          dueDate: editTodo.dueDate ? new Date(editTodo.dueDate) : null,
          listId: editTodo.list?.id ?? null,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          priority: DEFAULT_PRIORITY,
          dueDate: null,
          listId: null,
        })
      }
    }
  }, [open, editTodo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const selectedList = categories.find((c) => c.id === formData.listId) || null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTodo ? 'Edit Todo' : 'Create New Todo'}
          </DialogTitle>
          <DialogDescription>
            {editTodo
              ? 'Update your todo details below.'
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
              onValueChange={(value) => {
                if (isPriority(value)) {
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              }}
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
            <Label>List</Label>
            <Select
              value={formData.listId || '__none__'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  listId: value === '__none__' ? null : value,
                }))
              }
            >
              <SelectTrigger id="list">
                <SelectValue placeholder="None (no list)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (no list)</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ backgroundColor: category.color || '#94a3b8' }} />
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedList && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  key={selectedList.id}
                  variant="outline"
                  style={{
                    borderColor: selectedList.color || undefined,
                    color: selectedList.color || undefined,
                  }}
                >
                  {selectedList.name}
                </Badge>
              </div>
            )}
          </div>

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
