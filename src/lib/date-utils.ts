import { formatDistanceToNow } from 'date-fns'

/**
 * Formats a date as a relative time string (e.g., "2 minutes ago", "in 3 hours")
 * 
 * @param date - The date to format (Date object, timestamp, or date string)
 * @returns A formatted relative time string with suffix (e.g., "2 minutes ago")
 * 
 * @example
 * ```ts
 * formatRelativeTime(new Date()) // "less than a minute ago"
 * formatRelativeTime(Date.now() - 60000) // "1 minute ago"
 * ```
 */
export function formatRelativeTime(date: Date | number | string): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date
  
  return formatDistanceToNow(dateObj, { addSuffix: true })
}
