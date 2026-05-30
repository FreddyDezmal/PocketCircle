import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Upsert user profile in our DB
      const email = data.user.email
      const existingUser = await prisma.user.findUnique({ where: { id: data.user.id } })
      if (!existingUser && email) {
        const displayName = email.split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
        await prisma.user.upsert({
          where: { id: data.user.id },
          update: {},
          create: {
            id: data.user.id,
            email,
            displayName,
          },
        })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
