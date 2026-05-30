import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { displayName } = await request.json()
  if (!displayName || displayName.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: displayName.trim() },
  })

  return NextResponse.json(user)
}
