import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number | string, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function generateInviteUrl(inviteCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/join/${inviteCode}`
}

export function getDaysUntil(date: Date | string): number {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID': return 'text-green-700 bg-green-50 border-green-200'
    case 'PENDING': return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'MISSED': return 'text-red-700 bg-red-50 border-red-200'
    case 'LATE': return 'text-orange-700 bg-orange-50 border-orange-200'
    default: return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case 'PAID': return 'bg-green-500'
    case 'PENDING': return 'bg-amber-400'
    case 'MISSED': return 'bg-red-500'
    case 'LATE': return 'bg-orange-400'
    default: return 'bg-gray-400'
  }
}
