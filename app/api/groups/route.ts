import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateContributionSchedules } from '@/lib/payout-logic'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
  contributionAmount: z.coerce.number().min(1),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  currency: z.string().length(3),
  startDate: z.string(),
})

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, contributionAmount, frequency, currency, startDate } = parsed.data

  const group = await prisma.group.create({
    data: {
      name,
      description,
      contributionAmount,
      frequency,
      currency,
      createdBy: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
        },
      },
    },
  })

  // Generate 12 months of contribution schedules
  await generateContributionSchedules(group.id, new Date(startDate), frequency, 12)

  return NextResponse.json(group, { status: 201 })
}
