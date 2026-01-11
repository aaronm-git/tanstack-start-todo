import type { Priority } from '../db/schema'

export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  critical: 'Critical',
}

export function getPriorityLabel(priority: Priority): string {
  return priorityLabels[priority] ?? 'Unknown'
}
