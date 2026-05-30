import { createClient } from './supabase/server'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function getCurrentUser() {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect('/login')
  return user
}

export async function requireGroupRole(
  groupId: string,
  userId: string,
  minRole: 'MEMBER' | 'ADMIN' | 'OWNER' = 'MEMBER'
) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  })
  if (!membership) throw new Error('Not a member of this group')
  const hierarchy = { MEMBER: 0, ADMIN: 1, OWNER: 2 }
  if (hierarchy[membership.role] < hierarchy[minRole]) {
    throw new Error('Insufficient permissions')
  }
  return membership
}
