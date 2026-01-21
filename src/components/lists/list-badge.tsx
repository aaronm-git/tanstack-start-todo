import { X } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ListBadgeProps {
  name: string
  color: string | null
  onClick?: () => void
  onRemove?: () => void
  variant?: 'default' | 'outline'
  className?: string
}

export function ListBadge({
  name,
  color,
  onClick,
  onRemove,
  variant = 'outline',
  className,
}: ListBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        'gap-1.5 pl-2 pr-1',
        onClick && 'cursor-pointer hover:bg-accent',
        className,
      )}
      style={{
        borderColor: color || undefined,
        color: color || undefined,
      }}
      onClick={onClick}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          backgroundColor: color || '#94a3b8',
        }}
      />
      <span>{name}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  )
}
