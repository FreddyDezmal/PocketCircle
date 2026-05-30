import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inviteCode } = await request.json()
  if (!inviteCode) return NextResponse.json({ error: 'Invite code required' }, { status: 400 })

  const group = await prisma.group.findUnique({ where: { inviteCode } })
  if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  if (!group.isActive) return NextResponse.json({ error: 'This group is no longer active' }, { status: 400 })

  // Check already a member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  })
  if (existing) return NextResponse.json({ groupId: group.id, alreadyMember: true })

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: session.user.id, role: 'MEMBER' },
  })

  // Notify group admins
  const admins = await prisma.groupMember.findMany({
    where: { groupId: group.id, role: { in: ['OWNER', 'ADMIN'] } },
    include: { user: true },
  })
  const joiner = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (joiner) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.userId,
        groupId: group.id,
        type: 'MEMBER_JOINED' as const,
        channel: 'IN_APP' as const,
        message: `${joiner.displayName} joined ${group.name}`,
        status: 'SENT' as const,
        sentAt: new Date(),
      })),
    })
  }

  return NextResponse.json({ groupId: group.id })
}
