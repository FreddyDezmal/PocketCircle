import { getCurrentUser, requireGroupRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { GroupSettingsClient } from '@/components/groups/GroupSettingsClient'

export default async function GroupSettingsPage({ params }: { params: { id: string } }) {
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
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()

  const isOwner = membership.role === 'OWNER'

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/groups/${params.id}`} className="text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Group settings</h1>
      </div>

      <GroupSettingsClient
        group={{
          id: group.id,
          name: group.name,
          description: group.description ?? '',
          inviteCode: group.inviteCode,
          isOwner,
        }}
        members={group.members.map(m => ({
          id: m.id,
          userId: m.userId,
          displayName: m.user.displayName,
          email: m.user.email ?? '',
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          isCurrentUser: m.userId === user.id,
        }))}
      />
    </div>
  )
}
