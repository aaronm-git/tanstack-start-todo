import { useState, useEffect, useRef, useCallback } from 'react'
import { Progress } from '../ui/progress'
import { cn } from '../../lib/utils'
import {
  useOptimisticProgress,
  useActivityDrawer,
  DEFAULT_PROGRESS_CONFIG,
} from '../../lib/optimistic-operations'

/**
 * Global progress bar that shows optimistic operation status.
 * 
 * - Fixed at the very top of the viewport
 * - Animates while operations are pending
 * - Clickable to open activity drawer
 * - No layout shift (position: fixed)
 */
export function GlobalProgressBar() {
  const { pendingCount, hasPendingOperations } = useOptimisticProgress()
  const { toggleDrawer } = useActivityDrawer()
  
  // Animation state
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Animation refs
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const previousPendingRef = useRef(0)
  
  // Calculate how long to take to reach max pending value
  const getAnimationDuration = useCallback((count: number) => {
    const { baseTime, additionalTimePerOperation } = DEFAULT_PROGRESS_CONFIG
    return baseTime + Math.max(0, count - 1) * additionalTimePerOperation
  }, [])
  
  // Animate progress while operations are pending
  useEffect(() => {
    const {
      initialValue,
      maxPendingValue,
      completionTime,
    } = DEFAULT_PROGRESS_CONFIG
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (hasPendingOperations) {
      // Start or continue animation
      setIsVisible(true)
      setIsCompleting(false)
      
      // If we're starting fresh (was at 0 or completing)
      if (progress === 0 || isCompleting || previousPendingRef.current === 0) {
        setProgress(initialValue)
        startTimeRef.current = Date.now()
      }
      
      // Animate toward maxPendingValue
      const duration = getAnimationDuration(pendingCount)
      
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current
        const progressRange = maxPendingValue - initialValue
        
        // Ease-out animation (slows down as it approaches max)
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // Cubic ease-out
        
        const newProgress = initialValue + progressRange * eased
        setProgress(Math.min(newProgress, maxPendingValue))
        
        if (t < 1 && hasPendingOperations) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    } else if (previousPendingRef.current > 0) {
      // Operations just completed - animate to 100% then fade out
      setIsCompleting(true)
      setProgress(100)
      
      // Fade out after completion
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsCompleting(false)
        setProgress(0)
      }, completionTime)
      
      return () => clearTimeout(timer)
    }
    
    previousPendingRef.current = pendingCount
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hasPendingOperations, pendingCount, getAnimationDuration, progress, isCompleting])
  
  // Handle click to open activity drawer
  const handleClick = useCallback(() => {
    toggleDrawer()
  }, [toggleDrawer])
  
  // Handle keyboard activation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDrawer()
    }
  }, [toggleDrawer])
  
  return (
    <>
      {/* Visually hidden live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {hasPendingOperations
          ? `Saving changes in progress`
          : isCompleting
          ? 'All changes saved'
          : ''}
      </div>
      
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[9999] h-1 cursor-pointer transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0',
          // Always clickable even when not visible
          'hover:opacity-100',
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          hasPendingOperations
            ? `Saving changes: ${Math.round(progress)}% complete. Press Enter to view activity log.`
            : 'Press Enter to view activity log'
        }
        aria-busy={hasPendingOperations}
        tabIndex={0}
      >
        <Progress
          value={progress}
          className={cn(
            'h-1 rounded-none',
            // Make it more visible on hover even when empty
            !isVisible && 'opacity-30 hover:opacity-60',
          )}
        />
        {/* Invisible hit area for better UX */}
        <div className="absolute inset-x-0 top-0 h-3 -translate-y-1" aria-hidden="true" />
      </div>
    </>
  )
}
