import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function JoinViaLinkPage({ params }: { params: { code: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const group = await prisma.group.findUnique({
    where: { inviteCode: params.code },
    include: { members: true },
  })

  if (!group) {
    return (
      <div className="min-h-screen bg-brand-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invite not found</h1>
          <p className="text-gray-500 text-sm mb-4">This invite link may have expired or is invalid.</p>
          <Link href="/" className="text-brand-600 font-medium text-sm">Go to PocketCircle</Link>
        </div>
      </div>
    )
  }

  // If logged in, auto-join and redirect
  if (session) {
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    })
    if (!existing) {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: session.user.id, role: 'MEMBER' },
      })
    }
    redirect(`/groups/${group.id}`)
  }

  // Not logged in — show landing page with join prompt
  return (
    <div className="min-h-screen bg-brand-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">💰</div>
        <p className="text-sm text-gray-500 mb-1">You've been invited to join</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{group.name}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {group.frequency.toLowerCase()} savings group
        </p>

        <Link
          href={`/login?next=/join/${params.code}`}
          className="block bg-brand-600 text-white rounded-xl py-3.5 text-base font-medium mb-3"
        >
          Sign in to join
        </Link>

        <p className="text-xs text-gray-400">
          Already have an account? Signing in will automatically add you to this group.
        </p>
      </div>
    </div>
  )
}
