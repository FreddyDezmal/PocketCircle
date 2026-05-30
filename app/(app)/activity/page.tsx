import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

const TYPE_ICONS: Record<string, string> = {
  CONTRIBUTION_DUE: '⏰',
  CONTRIBUTION_MISSED: '❌',
  CONTRIBUTION_CONFIRMED: '✅',
  PAYOUT_UPCOMING: '💸',
  PAYOUT_RECEIVED: '🎉',
  MEMBER_JOINED: '👋',
  GENERAL: '📢',
}

export default async function ActivityPage() {
  const user = await getCurrentUser()

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity</h1>

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🔔</div>
            <p className="font-medium text-gray-700 mb-1">No notifications yet</p>
            <p className="text-sm text-gray-500">Reminders and updates will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(n => (
            <Card key={n.id} padded className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 flex-shrink-0">{TYPE_ICONS[n.type] || '📢'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
              </div>
              <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                n.status === 'SENT' ? 'bg-green-400' : 'bg-gray-300'
              }`} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
