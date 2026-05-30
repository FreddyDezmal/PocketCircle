import { getCurrentUser, requireGroupRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort, getDaysUntil } from '@/lib/utils'
import { InviteButton } from '@/components/groups/InviteButton'
import { LogPaymentButton } from '@/components/contributions/LogPaymentButton'
import { ConfirmPaymentButton } from '@/components/contributions/ConfirmPaymentButton'

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
      contributionSchedules: {
        orderBy: { dueDate: 'asc' },
        include: {
          contributions: {
            include: { user: true },
          },
        },
      },
      payoutSlots: {
        orderBy: { slotOrder: 'asc' },
        include: { user: true },
      },
    },
  })

  if (!group) notFound()

  let membership
  try {
    membership = await requireGroupRole(params.id, user.id)
  } catch {
    notFound()
  }

  const isAdmin = membership.role === 'ADMIN' || membership.role === 'OWNER'

  // Current period
  const now = new Date()
  const currentSchedule = group.contributionSchedules.find(
    s => new Date(s.dueDate) >= now
  ) || group.contributionSchedules[group.contributionSchedules.length - 1]

  const myContrib = currentSchedule?.contributions.find(c => c.userId === user.id)
  const daysUntil = currentSchedule ? getDaysUntil(currentSchedule.dueDate) : null

  // Total paid
  const totalPaid = group.contributionSchedules
    .flatMap(s => s.contributions)
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + Number(c.amountPaid), 0)

  const paidCount = currentSchedule?.contributions.filter(c => c.status === 'PAID').length || 0
  const progress = group.members.length > 0 ? (paidCount / group.members.length) * 100 : 0

  const nextPayout = group.payoutSlots.find(p => p.status === 'PENDING' || p.status === 'SCHEDULED')

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/groups" className="text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{group.name}</h1>
        <InviteButton inviteCode={group.inviteCode} groupName={group.name} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card padded className="text-center">
          <p className="text-xs text-gray-500 mb-1">Pool</p>
          <p className="text-sm font-bold text-brand-700">{formatCurrency(totalPaid, group.currency)}</p>
        </Card>
        <Card padded className="text-center">
          <p className="text-xs text-gray-500 mb-1">Members</p>
          <p className="text-sm font-bold text-gray-800">{group.members.length}</p>
        </Card>
        <Card padded className="text-center">
          <p className="text-xs text-gray-500 mb-1">Amount</p>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(Number(group.contributionAmount), group.currency)}</p>
        </Card>
      </div>

      {/* Current period */}
      {currentSchedule && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500">Current period</p>
              <p className="font-semibold text-gray-900">{currentSchedule.periodLabel}</p>
            </div>
            {daysUntil !== null && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                daysUntil <= 0 ? 'bg-red-50 text-red-600' :
                daysUntil <= 3 ? 'bg-amber-50 text-amber-600' :
                'bg-green-50 text-green-600'
              }`}>
                {daysUntil === 0 ? 'Due today' : daysUntil > 0 ? `${daysUntil} days left` : `${Math.abs(daysUntil)}d overdue`}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{paidCount}/{group.members.length} paid</span>
          </div>
          {/* My status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">My status:</span>
              <StatusBadge status={myContrib?.status || 'PENDING'} />
            </div>
            {(!myContrib || myContrib.status === 'PENDING') && (
              <LogPaymentButton
                scheduleId={currentSchedule.id}
                groupId={group.id}
                amount={Number(group.contributionAmount)}
                currency={group.currency}
              />
            )}
          </div>
        </Card>
      )}

      {/* Members & contributions */}
      <Card className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Members this period</h2>
        <div className="flex flex-col divide-y divide-gray-50">
          {group.members.map(({ user: member }) => {
            const contrib = currentSchedule?.contributions.find(c => c.userId === member.id)
            return (
              <div key={member.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={member.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{member.displayName}</p>
                  {contrib?.paidAt && (
                    <p className="text-xs text-gray-400">Paid {formatDateShort(contrib.paidAt)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={contrib?.status || 'PENDING'} />
                  {isAdmin && contrib?.status === 'PENDING' && contrib?.proofUrl && (
                    <ConfirmPaymentButton
                      contributionId={contrib.id}
                      memberName={member.displayName}
                      groupId={group.id}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Payout order */}
      <Card className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Payout order</h2>
        <div className="flex flex-col gap-2">
          {group.payoutSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No payout order set yet.</p>
          ) : (
            group.payoutSlots.map(slot => (
              <div key={slot.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  slot.status === 'PAID' ? 'bg-green-100 text-green-700' :
                  slot.id === nextPayout?.id ? 'bg-brand-600 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {slot.slotOrder}
                </span>
                <Avatar name={slot.user.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {slot.user.displayName}
                    {slot.user.id === user.id && <span className="text-brand-600"> (you)</span>}
                  </p>
                  {slot.scheduledDate && (
                    <p className="text-xs text-gray-400">{formatDateShort(slot.scheduledDate)}</p>
                  )}
                </div>
                <StatusBadge status={slot.status} />
              </div>
            ))
          )}
        </div>
        {isAdmin && (
          <Link
            href={`/groups/${group.id}/payouts`}
            className="mt-3 block text-center text-sm text-brand-600 font-medium py-2 border border-brand-200 rounded-xl"
          >
            Manage payouts
          </Link>
        )}
      </Card>

      {/* Contribution history */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">History</h2>
          <Link href={`/groups/${group.id}/history`} className="text-xs text-brand-600">View all</Link>
        </div>
        <div className="flex flex-col gap-2">
          {group.contributionSchedules.slice(0, 3).map(schedule => {
            const paidInPeriod = schedule.contributions.filter(c => c.status === 'PAID').length
            return (
              <div key={schedule.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm text-gray-700">{schedule.periodLabel}</p>
                  <p className="text-xs text-gray-400">{paidInPeriod}/{group.members.length} paid</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full"
                      style={{ width: `${group.members.length > 0 ? (paidInPeriod / group.members.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(group.members.length > 0 ? (paidInPeriod / group.members.length) * 100 : 0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Admin: settings link */}
      {isAdmin && (
        <Link
          href={`/groups/${group.id}/settings`}
          className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 mb-4"
        >
          ⚙️ Group settings
        </Link>
      )}
    </div>
  )
}
