import { useEffect, useState } from 'react'
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
import { Label } from '../ui/label'
import type { ListWithCount } from '../../lib/tasks'

interface ListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ListFormData) => void
  editList?: ListWithCount | null
  isSubmitting?: boolean
}

export interface ListFormData {
  name: string
  color: string | null
}

const defaultColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

export function ListDialog({
  open,
  onOpenChange,
  onSubmit,
  editList,
  isSubmitting = false,
}: ListDialogProps) {
  const [formData, setFormData] = useState<ListFormData>({
    name: '',
    color: defaultColors[0],
  })

  // Reset form when dialog opens/closes or editList changes
  useEffect(() => {
    if (open) {
      if (editList) {
        setFormData({
          name: editList.name,
          color: editList.color || defaultColors[0],
        })
      } else {
        setFormData({
          name: '',
          color: defaultColors[0],
        })
      }
    }
  }, [open, editList])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editList ? 'Edit List' : 'Create New List'}
          </DialogTitle>
          <DialogDescription>
            {editList
              ? 'Update your list details below.'
              : 'Add a new list to organize your todos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="list-name">Name *</Label>
            <Input
              id="list-name"
              placeholder="Enter list name..."
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      formData.color === color ? '#000' : 'transparent',
                  }}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
            {/* Custom Color Input */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                type="color"
                value={formData.color || '#000000'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-20 h-10 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                Or pick a custom color
              </span>
            </div>
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
              {isSubmitting
                ? 'Saving...'
                : editList
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
