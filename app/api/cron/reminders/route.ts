import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContributionReminder } from '@/lib/notifications'
import { addDays } from 'date-fns'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in2Days = addDays(now, 2)
  const tomorrow = addDays(now, 1)

  // Find schedules due in the next 2 days
  const upcomingSchedules = await prisma.contributionSchedule.findMany({
    where: {
      dueDate: { gte: now, lte: in2Days },
      status: 'PENDING',
    },
    include: {
      group: true,
      contributions: { where: { status: 'PAID' }, select: { userId: true } },
    },
  })

  let remindersSent = 0

  for (const schedule of upcomingSchedules) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: schedule.groupId },
      select: { userId: true },
    })

    const paidIds = new Set(schedule.contributions.map(c => c.userId))
    const unpaidMemberIds = allMembers
      .map(m => m.userId)
      .filter(id => !paidIds.has(id))

    for (const userId of unpaidMemberIds) {
      // Don't double-send if we already sent in the last 20 hours
      const recentNotif = await prisma.notification.findFirst({
        where: {
          userId,
          groupId: schedule.groupId,
          type: 'CONTRIBUTION_DUE',
          sentAt: { gte: addDays(now, -1) },
        },
      })
      if (recentNotif) continue

      try {
        await sendContributionReminder({
          userId,
          groupId: schedule.groupId,
          groupName: schedule.group.name,
          dueDate: schedule.dueDate,
          amount: Number(schedule.group.contributionAmount),
          currency: schedule.group.currency,
        })
        remindersSent++
      } catch (e) {
        console.error(`Failed to send reminder to ${userId}:`, e)
      }
    }
  }

  // Mark overdue contributions as MISSED
  const overdueSchedules = await prisma.contributionSchedule.findMany({
    where: {
      dueDate: { lt: now },
      status: 'PENDING',
    },
    include: {
      group: true,
    },
  })

  let missedMarked = 0
  for (const schedule of overdueSchedules) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: schedule.groupId },
      select: { userId: true },
    })

    for (const { userId } of allMembers) {
      const existing = await prisma.contribution.findUnique({
        where: { scheduleId_userId: { scheduleId: schedule.id, userId } },
      })

      if (!existing) {
        await prisma.contribution.create({
          data: {
            scheduleId: schedule.id,
            userId,
            amountPaid: 0,
            status: 'MISSED',
          },
        })

        await prisma.notification.create({
          data: {
            userId,
            groupId: schedule.groupId,
            type: 'CONTRIBUTION_MISSED',
            channel: 'IN_APP',
            message: `You missed your contribution for ${schedule.group.name} — ${schedule.periodLabel}`,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
        missedMarked++
      } else if (existing.status === 'PENDING') {
        await prisma.contribution.update({
          where: { id: existing.id },
          data: { status: 'MISSED' },
        })
        missedMarked++
      }
    }

    // Mark schedule as completed
    await prisma.contributionSchedule.update({
      where: { id: schedule.id },
      data: { status: 'COMPLETED' },
    })
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    missedMarked,
    timestamp: now.toISOString(),
  })
}
