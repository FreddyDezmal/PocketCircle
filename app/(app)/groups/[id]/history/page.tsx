import { getCurrentUser, requireGroupRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'

export default async function HistoryPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  try {
    await requireGroupRole(params.id, user.id)
  } catch {
    notFound()
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true } },
      contributionSchedules: {
        orderBy: { dueDate: 'desc' },
        include: {
          contributions: {
            include: { user: true },
          },
        },
      },
    },
  })

  if (!group) notFound()

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/groups/${params.id}`} className="text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Contribution history</h1>
      </div>

      <div className="flex flex-col gap-4">
        {group.contributionSchedules.map(schedule => {
          const paidCount = schedule.contributions.filter(c => c.status === 'PAID').length
          const totalCollected = schedule.contributions
            .filter(c => c.status === 'PAID')
            .reduce((sum, c) => sum + Number(c.amountPaid), 0)

          return (
            <Card key={schedule.id} padded={false}>
              {/* Period header */}
              <div className="px-4 py-3 bg-gray-50 rounded-t-2xl border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{schedule.periodLabel}</p>
                  <p className="text-xs text-gray-500">Due {formatDateShort(schedule.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-700">{formatCurrency(totalCollected, group.currency)}</p>
                  <p className="text-xs text-gray-500">{paidCount}/{group.members.length} paid</p>
                </div>
              </div>

              {/* Member rows */}
              <div className="px-4 divide-y divide-gray-50">
                {group.members.map(({ user: member }) => {
                  const contrib = schedule.contributions.find(c => c.userId === member.id)
                  return (
                    <div key={member.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={member.displayName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{member.displayName}</p>
                        {contrib?.paidAt && (
                          <p className="text-xs text-gray-400">{formatDateShort(contrib.paidAt)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {contrib?.amountPaid && (
                          <p className="text-xs font-medium text-gray-600 mb-0.5">
                            {formatCurrency(Number(contrib.amountPaid), group.currency)}
                          </p>
                        )}
                        <StatusBadge status={contrib?.status || 'PENDING'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
