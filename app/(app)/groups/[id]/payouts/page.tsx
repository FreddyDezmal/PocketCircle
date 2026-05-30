import { getCurrentUser, requireGroupRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { ManagePayoutsClient } from '@/components/payouts/ManagePayoutsClient'

export default async function PayoutsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  let membership
  try {
    membership = await requireGroupRole(params.id, user.id, 'ADMIN')
  } catch {
    notFound()
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
      payoutSlots: {
        include: { user: true },
        orderBy: { slotOrder: 'asc' },
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
        <h1 className="text-xl font-bold text-gray-900">Payout order</h1>
      </div>

      <Card className="mb-4">
        <p className="text-sm text-gray-500 mb-4">
          Set the order members will receive the group payout. Drag to reorder, or use the buttons below.
        </p>
        <ManagePayoutsClient
          groupId={group.id}
          members={group.members.map(m => ({ id: m.user.id, displayName: m.user.displayName }))}
          payoutSlots={group.payoutSlots.map(s => ({
            id: s.id,
            userId: s.userId,
            slotOrder: s.slotOrder,
            scheduledDate: s.scheduledDate?.toISOString() ?? null,
            paidDate: s.paidDate?.toISOString() ?? null,
            status: s.status,
            userName: s.user.displayName,
          }))}
          contributionAmount={Number(group.contributionAmount)}
          currency={group.currency}
          frequency={group.frequency}
        />
      </Card>
    </div>
  )
}
