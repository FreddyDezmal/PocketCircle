import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'amber' | 'red' | 'gray' | 'brand'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        {
          'bg-green-50 text-green-800 border-green-200': variant === 'green',
          'bg-amber-50 text-amber-800 border-amber-200': variant === 'amber',
          'bg-red-50 text-red-800 border-red-200': variant === 'red',
          'bg-gray-50 text-gray-700 border-gray-200': variant === 'gray',
          'bg-brand-50 text-brand-700 border-brand-200': variant === 'brand',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'green' | 'amber' | 'red' | 'gray' }> = {
    PAID: { label: 'Paid', variant: 'green' },
    PENDING: { label: 'Pending', variant: 'amber' },
    MISSED: { label: 'Missed', variant: 'red' },
    LATE: { label: 'Late', variant: 'red' },
    SCHEDULED: { label: 'Scheduled', variant: 'brand' as 'gray' },
    COMPLETED: { label: 'Completed', variant: 'green' },
  }
  const config = map[status] || { label: status, variant: 'gray' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
