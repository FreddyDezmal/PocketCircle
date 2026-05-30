import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort, getDaysUntil } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: true,
          contributionSchedules: {
            where: { dueDate: { gte: new Date() } },
            orderBy: { dueDate: 'asc' },
            take: 1,
            include: {
              contributions: { where: { userId: user.id } },
            },
          },
          payoutSlots: {
            where: { status: { in: ['PENDING', 'SCHEDULED'] } },
            orderBy: { slotOrder: 'asc' },
            take: 1,
            include: { user: true },
          },
        },
      },
    },
  })

  const totalSaved = await prisma.contribution.aggregate({
    where: { userId: user.id, status: 'PAID' },
    _sum: { amountPaid: true },
  })

  const getHour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{getHour()}</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.displayName.split(' ')[0]} 👋</h1>
        </div>
        <Link href="/profile">
          <Avatar name={user.displayName} size="lg" />
        </Link>
      </div>

      {/* Total saved */}
      <Card className="bg-brand-600 border-brand-700 mb-4" padded>
        <p className="text-brand-200 text-xs mb-1">Total saved — all groups</p>
        <p className="text-3xl font-bold text-white">
          {formatCurrency(Number(totalSaved._sum.amountPaid || 0))}
        </p>
        <p className="text-brand-300 text-xs mt-1">Across {memberships.length} group{memberships.length !== 1 ? 's' : ''}</p>
      </Card>

      {/* Groups */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">My groups</h2>
        <Link href="/groups/new" className="text-sm text-brand-600 font-medium">+ New</Link>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🏦</div>
            <p className="text-sm font-medium text-gray-700">No groups yet</p>
            <p className="text-xs text-gray-500 mb-4">Create or join a savings group to get started.</p>
            <Link
              href="/groups/new"
              className="inline-flex items-center justify-center bg-brand-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Create a group
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {memberships.map(({ group, role }) => {
            const nextSchedule = group.contributionSchedules[0]
            const myContrib = nextSchedule?.contributions[0]
            const nextPayout = group.payoutSlots[0]
            const daysUntil = nextSchedule ? getDaysUntil(nextSchedule.dueDate) : null

            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card padded className="hover:shadow-md transition-shadow active:scale-[0.99]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                      💰
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                        {myContrib ? (
                          <StatusBadge status={myContrib.status} />
                        ) : nextSchedule ? (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {daysUntil === 0 ? 'Due today' : daysUntil && daysUntil > 0 ? `Due in ${daysUntil}d` : 'Overdue'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.members.length} members · {formatCurrency(Number(group.contributionAmount))} {group.frequency.toLowerCase()}
                      </p>
                      {nextPayout && (
                        <p className="text-xs text-brand-600 mt-0.5">
                          Next payout: {nextPayout.user.displayName}
                          {nextPayout.scheduledDate && ` · ${formatDateShort(nextPayout.scheduledDate)}`}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Quick join */}
      <div className="mt-4">
        <Link href="/groups/join" className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border border-dashed border-gray-300 rounded-2xl hover:bg-gray-50">
          <span>🔗</span> Join with invite code
        </Link>
      </div>
    </div>
  )
}
