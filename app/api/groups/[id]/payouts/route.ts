import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireGroupRole } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slots = await prisma.payoutSlot.findMany({
    where: { groupId: params.id },
    include: { user: true },
    orderBy: { slotOrder: 'asc' },
  })

  return NextResponse.json(slots)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'ADMIN')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slots } = await request.json()

  // Delete existing pending/scheduled slots, then recreate
  await prisma.payoutSlot.deleteMany({
    where: { groupId: params.id, status: { in: ['PENDING', 'SCHEDULED'] } },
  })

  const created = await prisma.payoutSlot.createMany({
    data: slots.map((s: { userId: string; slotOrder: number; scheduledDate?: string }) => ({
      groupId: params.id,
      userId: s.userId,
      slotOrder: s.slotOrder,
      scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : null,
      status: 'PENDING',
    })),
  })

  return NextResponse.json({ count: created.count })
}
