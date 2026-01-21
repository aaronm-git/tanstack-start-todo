import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type KeyboardEvent,
  type FocusEvent,
} from 'react'
import { cn } from '../../lib/utils'

export interface EditableInputProps {
  /** Current value */
  value: string
  /** Called when value changes and should be saved (on blur or Enter) */
  onSave: (value: string) => void
  /** Placeholder text when empty */
  placeholder?: string
  /** Whether the input should auto-focus on mount */
  autoFocus?: boolean
  /** Called when editing starts (focus) */
  onEditStart?: () => void
  /** Called when editing ends (blur or save) */
  onEditEnd?: () => void
  /** Called when user presses Escape */
  onCancel?: () => void
  /** Additional class names for the container */
  className?: string
  /** Additional class names for the text display (when not focused) */
  textClassName?: string
  /** Additional class names for the input */
  inputClassName?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether to show as text when blurred even if empty */
  showEmptyAsText?: boolean
  /** Text to show when empty and not editing */
  emptyText?: string
  /** Required field - won't allow saving empty value */
  required?: boolean
  /** aria-label for accessibility */
  'aria-label'?: string
}

/**
 * Editable input that is ALWAYS an input element (never switches to div).
 * Looks like text when not focused, shows input styling when focused.
 * Saves only on blur or Enter - no debounced saves while typing.
 * This prevents focus loss during re-renders since the DOM element never changes.
 */
export const EditableInput = forwardRef<HTMLInputElement, EditableInputProps>(
  function EditableInput(
    {
      value,
      onSave,
      placeholder = 'Click to edit...',
      autoFocus = false,
      onEditStart,
      onEditEnd,
      onCancel,
      className,
      textClassName,
      inputClassName,
      disabled = false,
      required = false,
      'aria-label': ariaLabel,
    },
    forwardedRef
  ) {
    const [isFocused, setIsFocused] = useState(false)
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const lastSavedRef = useRef(value)
    const isFocusedRef = useRef(false)
    
    // Keep ref in sync with state for use in effects
    useEffect(() => {
      isFocusedRef.current = isFocused
    }, [isFocused])
    
    // Sync local value when prop changes (from server response)
    // Only runs when VALUE changes, not when focus changes
    // This prevents reverting to old value on blur before mutation completes
    useEffect(() => {
      // Don't sync if user is currently editing
      if (isFocusedRef.current) return
      
      // Only sync if the server sent back something different than what we saved
      // This handles: server normalization, concurrent updates, error rollbacks
      if (value !== lastSavedRef.current) {
        setLocalValue(value)
        lastSavedRef.current = value
      }
    }, [value]) // Only depend on value prop changes
    
    // Handle save - only called on blur or Enter
    const handleSave = useCallback((newValue: string) => {
      // Don't save if value hasn't changed
      if (newValue === lastSavedRef.current) return
      
      // Don't save empty if required
      if (required && !newValue.trim()) return
      
      lastSavedRef.current = newValue
      onSave(newValue)
    }, [onSave, required])
    
    // Handle input change - just update local state, no save
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
    }, [])
    
    // Handle focus
    const handleFocus = useCallback(() => {
      setIsFocused(true)
      onEditStart?.()
    }, [onEditStart])
    
    // Handle blur - save on blur
    const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
      // Check if focus is moving to another element within our component
      const relatedTarget = e.relatedTarget as HTMLElement | null
      if (relatedTarget?.closest('[data-editable-container]')) {
        return
      }
      
      setIsFocused(false)
      
      // If value is empty, call onCancel instead of save (handles draft cancellation)
      if (!localValue.trim() && onCancel) {
        onCancel()
        onEditEnd?.()
        return
      }
      
      handleSave(localValue)
      onEditEnd?.()
    }, [handleSave, localValue, onEditEnd, onCancel])
    
    // Handle key press
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        // Save and blur
        handleSave(localValue)
        inputRef.current?.blur()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        // Restore original value and blur
        setLocalValue(lastSavedRef.current)
        inputRef.current?.blur()
        onCancel?.()
      }
    }, [handleSave, localValue, onCancel])
    
    // Combine refs
    const setRefs = useCallback((node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    }, [forwardedRef])
    
    return (
      <div
        className={cn('relative inline-flex items-center', className)}
        data-editable-container
      >
        <input
          ref={setRefs}
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            // Base styles - always an input but looks like text when not focused
            'w-full bg-transparent border-0 outline-none',
            'rounded px-1 -ml-1 py-0.5',
            'transition-colors',
            // Unfocused: looks like plain text
            !isFocused && [
              'hover:bg-accent/50',
              !localValue && 'text-muted-foreground',
              textClassName,
            ],
            // Focused: shows input styling
            isFocused && [
              'bg-background ring-2 ring-ring ring-offset-2 ring-offset-background',
              inputClassName,
            ],
            // Disabled state
            disabled && 'cursor-default opacity-50 hover:bg-transparent',
          )}
          aria-label={ariaLabel}
        />
      </div>
    )
  }
)
