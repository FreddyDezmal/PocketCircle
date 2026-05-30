import { prisma } from './prisma'
import { addMonths, addWeeks } from 'date-fns'
import { Frequency } from '@prisma/client'

export async function generateContributionSchedules(
  groupId: string,
  startDate: Date,
  frequency: Frequency,
  numberOfPeriods = 12
) {
  const schedules = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < numberOfPeriods; i++) {
    const periodLabel = currentDate.toLocaleDateString('en-ZA', {
      month: 'long',
      year: 'numeric',
    })

    schedules.push({
      groupId,
      dueDate: new Date(currentDate),
      periodLabel,
      status: 'PENDING' as const,
    })

    if (frequency === 'MONTHLY') {
      currentDate = addMonths(currentDate, 1)
    } else if (frequency === 'BIWEEKLY') {
      currentDate = addWeeks(currentDate, 2)
    } else {
      currentDate = addWeeks(currentDate, 1)
    }
  }

  await prisma.contributionSchedule.createMany({ data: schedules })
  return schedules
}

export async function getGroupStats(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      contributionSchedules: {
        include: { contributions: true },
        orderBy: { dueDate: 'asc' },
      },
      payoutSlots: {
        include: { user: true },
        orderBy: { slotOrder: 'asc' },
      },
    },
  })

  if (!group) return null

  const totalExpected =
    group.members.length *
    group.contributionSchedules.filter(s => s.status !== 'PENDING').length *
    Number(group.contributionAmount)

  const totalPaid = group.contributionSchedules
    .flatMap(s => s.contributions)
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + Number(c.amountPaid), 0)

  const upcomingSchedule = group.contributionSchedules.find(
    s => new Date(s.dueDate) >= new Date()
  )

  const nextPayout = group.payoutSlots.find(p => p.status === 'PENDING' || p.status === 'SCHEDULED')

  return {
    group,
    totalExpected,
    totalPaid,
    upcomingSchedule,
    nextPayout,
    memberCount: group.members.length,
  }
}

export async function getMemberContributionStats(groupId: string, userId: string) {
  const schedules = await prisma.contributionSchedule.findMany({
    where: { groupId },
    include: {
      contributions: { where: { userId } },
    },
    orderBy: { dueDate: 'desc' },
  })

  const paid = schedules.filter(s => s.contributions[0]?.status === 'PAID').length
  const missed = schedules.filter(s => s.contributions[0]?.status === 'MISSED').length
  const pending = schedules.filter(
    s => !s.contributions[0] || s.contributions[0].status === 'PENDING'
  ).length

  const streak = calculateStreak(schedules)

  return { paid, missed, pending, streak, schedules }
}

function calculateStreak(
  schedules: Array<{ dueDate: Date; contributions: Array<{ status: string }> }>
): number {
  const sorted = [...schedules].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  )
  let streak = 0
  for (const s of sorted) {
    if (new Date(s.dueDate) > new Date()) continue
    if (s.contributions[0]?.status === 'PAID') streak++
    else break
  }
  return streak
}
