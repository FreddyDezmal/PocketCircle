import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ProfileClient } from '@/components/groups/ProfileClient'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  const [membershipCount, totalContributed, streakData] = await Promise.all([
    prisma.groupMember.count({ where: { userId: user.id } }),
    prisma.contribution.aggregate({
      where: { userId: user.id, status: 'PAID' },
      _sum: { amountPaid: true },
    }),
    prisma.contribution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { status: true, createdAt: true },
    }),
  ])

  // Calculate streak
  let streak = 0
  for (const c of streakData) {
    if (c.status === 'PAID') streak++
    else break
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      {/* Avatar + name */}
      <Card className="flex flex-col items-center py-8 mb-4">
        <Avatar name={user.displayName} size="lg" className="w-20 h-20 text-2xl mb-3" />
        <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
        <p className="text-sm text-gray-500 mt-1">{user.email || user.phone}</p>
        <p className="text-xs text-gray-400 mt-1">Member since {formatDate(user.createdAt)}</p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card padded className="text-center">
          <p className="text-2xl font-bold text-brand-600">{membershipCount}</p>
          <p className="text-xs text-gray-500 mt-1">Groups</p>
        </Card>
        <Card padded className="text-center">
          <p className="text-2xl font-bold text-brand-600">{streak}</p>
          <p className="text-xs text-gray-500 mt-1">🔥 Streak</p>
        </Card>
        <Card padded className="text-center">
          <p className="text-lg font-bold text-brand-600">
            {formatCurrency(Number(totalContributed._sum.amountPaid || 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">Saved</p>
        </Card>
      </div>

      {/* Edit profile + sign out */}
      <ProfileClient user={{ id: user.id, displayName: user.displayName, email: user.email ?? '' }} />
    </div>
  )
}
