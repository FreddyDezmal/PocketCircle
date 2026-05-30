import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireGroupRole } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  scheduleId: z.string().uuid(),
  amountPaid: z.number().min(0.01),
  notes: z.string().max(200).optional(),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { scheduleId, amountPaid, notes } = parsed.data

  // Upsert — member can resubmit if pending
  const contribution = await prisma.contribution.upsert({
    where: { scheduleId_userId: { scheduleId, userId: session.user.id } },
    update: { amountPaid, notes, status: 'PENDING', paidAt: new Date() },
    create: {
      scheduleId,
      userId: session.user.id,
      amountPaid,
      notes,
      status: 'PENDING',
      paidAt: new Date(),
    },
  })

  // Notify admins
  const admins = await prisma.groupMember.findMany({
    where: { groupId: params.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  const payer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { displayName: true } })
  const group = await prisma.group.findUnique({ where: { id: params.id }, select: { name: true, currency: true } })

  if (payer && group) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.userId,
        groupId: params.id,
        type: 'GENERAL' as const,
        channel: 'IN_APP' as const,
        message: `${payer.displayName} logged a payment of ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: group.currency }).format(amountPaid)} in ${group.name} — pending confirmation`,
        status: 'SENT' as const,
        sentAt: new Date(),
      })),
    })
  }

  return NextResponse.json(contribution, { status: 201 })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contributions = await prisma.contribution.findMany({
    where: {
      schedule: { groupId: params.id },
    },
    include: { user: true, schedule: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(contributions)
}
