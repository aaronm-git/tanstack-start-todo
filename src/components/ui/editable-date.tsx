import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, X } from 'lucide-react'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { cn } from '../../lib/utils'

export interface EditableDateProps {
  /** Current date value (null for no date) */
  value: Date | null
  /** Called when date changes */
  onSave: (date: Date | null) => void
  /** Placeholder text when no date */
  placeholder?: string
  /** Whether the field is currently saving */
  isSaving?: boolean
  /** Format string for displaying the date */
  dateFormat?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
  /** Whether to show a clear button */
  clearable?: boolean
  /** aria-label for accessibility */
  'aria-label'?: string
}

/**
 * Editable date field with calendar popover.
 * Click to open calendar, select date to save.
 */
export function EditableDate({
  value,
  onSave,
  placeholder = 'Pick a date',
  isSaving = false,
  dateFormat = 'PPP',
  disabled = false,
  className,
  clearable = true,
  'aria-label': ariaLabel,
}: EditableDateProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Handle date selection
  const handleSelect = useCallback((date: Date | undefined) => {
    onSave(date || null)
    setIsOpen(false)
  }, [onSave])
  
  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSave(null)
  }, [onSave])
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-auto py-1 px-2 -ml-2 justify-start text-left font-normal',
            'hover:bg-accent/50',
            !value && 'text-muted-foreground',
            disabled && 'opacity-50 cursor-default hover:bg-transparent',
            className,
          )}
          disabled={disabled || isSaving}
          aria-label={ariaLabel || (value ? `Due date: ${format(value, dateFormat)}. Click to change.` : 'Click to set due date.')}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {value ? format(value, dateFormat) : placeholder}
          </span>
          
          {/* Clear button */}
          {clearable && value && !isSaving && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClear(e as unknown as React.MouseEvent)
                }
              }}
              className="ml-2 p-0.5 rounded hover:bg-accent"
              aria-label="Clear date"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          
          {/* Saving indicator */}
          {isSaving && (
            <Loader2 className="ml-2 h-3 w-3 animate-spin" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
