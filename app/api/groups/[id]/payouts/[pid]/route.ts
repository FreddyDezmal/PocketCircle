import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireGroupRole } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; pid: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'ADMIN')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status, paidDate } = await request.json()

  const slot = await prisma.payoutSlot.update({
    where: { id: params.pid },
    data: {
      status,
      paidDate: paidDate ? new Date(paidDate) : undefined,
    },
    include: { user: true, group: true },
  })

  // Notify recipient
  if (status === 'PAID') {
    await prisma.notification.create({
      data: {
        userId: slot.userId,
        groupId: params.id,
        type: 'PAYOUT_RECEIVED',
        channel: 'IN_APP',
        message: `🎉 You received your payout from ${slot.group.name}!`,
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  }

  return NextResponse.json(slot)
}
