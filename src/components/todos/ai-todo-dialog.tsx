import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import type { TodoWithRelations, ListWithCount } from '../../lib/tasks'

interface AITodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (todo: TodoWithRelations) => void
  onStartGeneration: (prompt: string) => void
  categories: ListWithCount[] // Prop name kept as 'categories' for backwards compat with dashboard
}

const examplePrompts = [
  'Schedule a team meeting for next Monday to discuss Q1 goals',
  'Buy groceries tomorrow - milk, eggs, and bread',
  'Finish the quarterly report by end of week, high priority',
  'Call mom on her birthday next Saturday',
  'Review pull requests before standup tomorrow morning',
]

export function AITodoDialog({
  open,
  onOpenChange,
  onStartGeneration,
}: AITodoDialogProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a task description')
      return
    }
    // Immediately trigger optimistic creation and close dialog
    onStartGeneration(prompt.trim())
    setPrompt('')
    onOpenChange(false)
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPrompt('')
      onOpenChange(false)
    } else {
      onOpenChange(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Task with AI
          </DialogTitle>
          <DialogDescription>
            Describe your task in natural language. AI will parse the details,
            set priority, and suggest a due date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">What do you need to do?</Label>
            <Textarea
              id="ai-prompt"
              placeholder="e.g., Schedule a dentist appointment for next Tuesday, high priority..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Example prompts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Try an example:
            </Label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.slice(0, 3).map((example, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1 px-2"
                  onClick={() => handleExampleClick(example)}
                >
                  {example.length > 40 ? example.slice(0, 40) + '...' : example}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!prompt.trim()}>
              <Sparkles className="size-4" />
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
