import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export default async function GroupsPage() {
  const user = await getCurrentUser()

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: { members: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <Link
          href="/groups/new"
          className="bg-brand-600 text-white rounded-xl px-3 py-1.5 text-sm font-medium"
        >
          + New
        </Link>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🤝</div>
            <p className="font-medium text-gray-800 mb-1">No groups yet</p>
            <p className="text-sm text-gray-500 mb-5">
              Create a savings group or join one with an invite link.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/groups/new" className="block bg-brand-600 text-white text-center rounded-xl py-3 text-sm font-medium">
                Create a group
              </Link>
              <Link href="/groups/join" className="block border border-gray-200 text-gray-700 text-center rounded-xl py-3 text-sm font-medium">
                Join with invite code
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-4">
            {memberships.map(({ group, role }) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card padded className="hover:shadow-md transition-shadow active:scale-[0.99]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                      💰
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                        {role !== 'MEMBER' && (
                          <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full capitalize">
                            {role.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.members.length} members · {formatCurrency(Number(group.contributionAmount))} {group.frequency.toLowerCase()}
                      </p>
                      {group.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{group.description}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Link href="/groups/join" className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border border-dashed border-gray-300 rounded-2xl hover:bg-gray-50">
            <span>🔗</span> Join with invite code
          </Link>
        </>
      )}
    </div>
  )
}
