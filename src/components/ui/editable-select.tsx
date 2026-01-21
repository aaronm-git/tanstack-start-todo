import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '../../lib/utils'

export interface SelectOption {
  value: string
  label: string
  color?: string
}

export interface EditableSelectProps {
  /** Current value */
  value: string | null
  /** Called when value changes */
  onSave: (value: string | null) => void
  /** Available options */
  options: SelectOption[]
  /** Placeholder text when no value */
  placeholder?: string
  /** Whether the field is currently saving */
  isSaving?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
  /** Whether to allow clearing (selecting null) */
  clearable?: boolean
  /** Label for the "none" option when clearable */
  clearLabel?: string
  /** aria-label for accessibility */
  'aria-label'?: string
}

/**
 * Editable select field.
 * Immediately saves on selection change.
 */
export function EditableSelect({
  value,
  onSave,
  options,
  placeholder = 'Select...',
  isSaving = false,
  disabled = false,
  className,
  clearable = false,
  clearLabel = 'None',
  'aria-label': ariaLabel,
}: EditableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Handle value change
  const handleValueChange = useCallback((newValue: string) => {
    const valueToSave = newValue === '__none__' ? null : newValue
    onSave(valueToSave)
    setIsOpen(false)
  }, [onSave])
  
  // Find current option for display
  const currentOption = options.find(o => o.value === value)
  
  return (
    <Select
      value={value || '__none__'}
      onValueChange={handleValueChange}
      disabled={disabled || isSaving}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger
        className={cn(
          'h-auto py-1 px-2 -ml-2 w-auto min-w-[100px]',
          'hover:bg-accent/50 border-none shadow-none',
          !value && 'text-muted-foreground',
          className,
        )}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
        {isSaving && (
          <Loader2 className="h-3 w-3 animate-spin ml-1" />
        )}
      </SelectTrigger>
      <SelectContent>
        {clearable && (
          <SelectItem value="__none__">{clearLabel}</SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
