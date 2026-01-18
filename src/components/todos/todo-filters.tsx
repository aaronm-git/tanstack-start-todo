import { Search, X, Filter, Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { priorityLabels, type Priority } from '../../lib/tasks'

export interface TodoFilters {
  search: string
  priority: Priority | 'all'
  categoryId: string | null
  status: 'all' | 'active' | 'completed'
}

// Type guards
function isStatus(value: string): value is TodoFilters['status'] {
  return value === 'all' || value === 'active' || value === 'completed'
}

function isPriorityOrAll(value: string): value is Priority | 'all' {
  return value === 'all' || value in priorityLabels
}

interface TodoFiltersProps {
  filters: TodoFilters
  onFiltersChange: (filters: TodoFilters) => void
  totalCount: number
  filteredCount: number
}

export function TodoFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: TodoFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.priority !== 'all' ||
    filters.categoryId !== null ||
    filters.status !== 'all'

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      priority: 'all',
      categoryId: null,
      status: 'all',
    })
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search todos..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 pr-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => onFiltersChange({ ...filters, search: '' })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Status Toggle */}
        <ToggleGroup
          type="single"
          value={filters.status}
          onValueChange={(value) => {
            if (value && isStatus(value)) {
              onFiltersChange({ ...filters, status: value })
            }
          }}
          className="border rounded-lg p-1"
        >
          <ToggleGroupItem value="all" aria-label="All todos" size="sm">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="active" aria-label="Active todos" size="sm">
            Active
          </ToggleGroupItem>
          <ToggleGroupItem
            value="completed"
            aria-label="Completed todos"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Completed
          </ToggleGroupItem>
          <ToggleGroupItem
            value="completed"
            aria-label="Completed todos"
            size="sm"
            className="sm:hidden"
          >
            Done
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Priority Filter */}
        <Select
          value={filters.priority}
          onValueChange={(value) => {
            if (isPriorityOrAll(value)) {
              onFiltersChange({ ...filters, priority: value })
            }
          }}
        >
          <SelectTrigger className="w-[120px] sm:w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 px-2 sm:px-3"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto">
          <Badge variant="secondary" className="text-xs">
            {filteredCount === totalCount
              ? `${totalCount} ${totalCount === 1 ? 'todo' : 'todos'}`
              : `${filteredCount} of ${totalCount}`}
          </Badge>
        </div>
      </div>
    </div>
  )
}
