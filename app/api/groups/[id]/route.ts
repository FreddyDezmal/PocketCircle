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
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true } },
      contributionSchedules: {
        include: { contributions: { include: { user: true } } },
        orderBy: { dueDate: 'asc' },
      },
      payoutSlots: { include: { user: true }, orderBy: { slotOrder: 'asc' } },
    },
  })

  return NextResponse.json(group)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'ADMIN')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, description } = await request.json()
  const group = await prisma.group.update({
    where: { id: params.id },
    data: { name, description },
  })

  return NextResponse.json(group)
}
