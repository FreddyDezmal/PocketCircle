import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireGroupRole } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; mid: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'ADMIN')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Can't remove the owner
  const target = await prisma.groupMember.findUnique({ where: { id: params.mid } })
  if (target?.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 })
  }

  await prisma.groupMember.delete({ where: { id: params.mid } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; mid: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireGroupRole(params.id, session.user.id, 'OWNER')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { role } = await request.json()
  const member = await prisma.groupMember.update({
    where: { id: params.mid },
    data: { role },
  })
  return NextResponse.json(member)
}
