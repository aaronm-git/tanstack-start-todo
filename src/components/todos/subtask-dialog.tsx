import { useState, useEffect } from 'react'
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
import type { Subtask } from '../../lib/tasks'

interface SubtaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
  editSubtask?: Subtask | null
  isSubmitting?: boolean
}

export function SubtaskDialog({
  open,
  onOpenChange,
  onSubmit,
  editSubtask,
  isSubmitting = false,
}: SubtaskDialogProps) {
  const [name, setName] = useState('')

  // Reset or populate form when dialog opens or editSubtask changes
  useEffect(() => {
    if (open) {
      if (editSubtask) {
        setName(editSubtask.name)
      } else {
        setName('')
      }
    }
  }, [open, editSubtask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editSubtask ? 'Edit Subtask' : 'Create New Subtask'}
            </DialogTitle>
            <DialogDescription>
              {editSubtask
                ? 'Update your subtask name below.'
                : 'Add a new subtask to your todo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subtask-name">Name *</Label>
              <Input
                id="subtask-name"
                placeholder="Enter subtask name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
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
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {editSubtask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
