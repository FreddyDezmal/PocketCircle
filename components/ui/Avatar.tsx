import { cn, getInitials } from '@/lib/utils'

const COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-coral-50 text-coral-600',
  'bg-blue-100 text-blue-800',
  'bg-pink-100 text-pink-800',
]

function getColor(name: string): string {
  const index = name.charCodeAt(0) % COLORS.length
  return COLORS[index]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        getColor(name),
        {
          'w-8 h-8 text-xs': size === 'sm',
          'w-10 h-10 text-sm': size === 'md',
          'w-12 h-12 text-base': size === 'lg',
        },
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
