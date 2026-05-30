import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireGroupRole } from '@/lib/auth'
import { sendPaymentConfirmed } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; cid: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'ADMIN')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status } = await request.json()
  if (!['PAID', 'MISSED', 'LATE'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const contribution = await prisma.contribution.update({
    where: { id: params.cid },
    data: {
      status,
      confirmedBy: session.user.id,
      confirmedAt: new Date(),
    },
    include: {
      user: true,
      schedule: { include: { group: true } },
    },
  })

  // Send confirmation notification if paid
  if (status === 'PAID') {
    try {
      await sendPaymentConfirmed({
        userId: contribution.userId,
        groupId: params.id,
        groupName: contribution.schedule.group.name,
        amount: Number(contribution.amountPaid),
        currency: contribution.schedule.group.currency,
      })
    } catch (e) {
      console.error('Failed to send confirmation email', e)
    }
  }

  return NextResponse.json(contribution)
}
