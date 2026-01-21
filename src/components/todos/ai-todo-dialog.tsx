import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
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
import { useMutation } from '@tanstack/react-query'
import { generateTodoWithAI } from '../../lib/server/ai'
import {
  todoWithRelationsSchema,
  type TodoWithRelations,
  type ListWithCount,
} from '../../lib/tasks'

interface AITodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (todo: TodoWithRelations) => void
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
  onSuccess,
  categories: lists,
}: AITodoDialogProps) {
  const [prompt, setPrompt] = useState('')

  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const result = await generateTodoWithAI({
        data: {
          prompt: userPrompt,
          lists: lists.map((c) => ({ id: c.id, name: c.name })),
        },
      })
      // Zod parse validates structure and returns properly typed data
      return todoWithRelationsSchema.parse(result)
    },
    onSuccess: (todo) => {
      toast.success('Task created with AI!')
      setPrompt('')
      onOpenChange(false)
      onSuccess(todo)
    },
    onError: (error) => {
      console.error('AI generation error:', error)
      toast.error('Failed to generate task. Please try again or create manually.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      toast.error('Please enter a task description')
      return
    }
    generateMutation.mutate(prompt.trim())
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !generateMutation.isPending) {
      setPrompt('')
      onOpenChange(false)
    } else if (isOpen) {
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
              disabled={generateMutation.isPending}
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
                  disabled={generateMutation.isPending}
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
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generateMutation.isPending || !prompt.trim()}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
