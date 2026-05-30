import { Resend } from 'resend'
import { prisma } from './prisma'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@pocketcircle.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendContributionReminder({
  userId,
  groupId,
  groupName,
  dueDate,
  amount,
  currency,
}: {
  userId: string
  groupId: string
  groupName: string
  dueDate: Date
  amount: number
  currency: string
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.email) return

  const formattedDate = dueDate.toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const formattedAmount = new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency,
  }).format(amount)

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Reminder: ${formattedAmount} due for ${groupName}`,
    html: buildReminderEmail({
      name: user.displayName,
      groupName,
      dueDate: formattedDate,
      amount: formattedAmount,
      groupUrl: `${APP_URL}/groups/${groupId}`,
    }),
  })

  await prisma.notification.create({
    data: {
      userId,
      groupId,
      type: 'CONTRIBUTION_DUE',
      channel: 'EMAIL',
      message: `Contribution of ${formattedAmount} due for ${groupName} on ${formattedDate}`,
      status: 'SENT',
      sentAt: new Date(),
    },
  })
}

export async function sendPaymentConfirmed({
  userId,
  groupId,
  groupName,
  amount,
  currency,
}: {
  userId: string
  groupId: string
  groupName: string
  amount: number
  currency: string
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.email) return

  const formattedAmount = new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency,
  }).format(amount)

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Payment confirmed for ${groupName}`,
    html: buildConfirmationEmail({
      name: user.displayName,
      groupName,
      amount: formattedAmount,
      groupUrl: `${APP_URL}/groups/${groupId}`,
    }),
  })

  await prisma.notification.create({
    data: {
      userId,
      groupId,
      type: 'CONTRIBUTION_CONFIRMED',
      channel: 'EMAIL',
      message: `Your ${formattedAmount} payment for ${groupName} was confirmed`,
      status: 'SENT',
      sentAt: new Date(),
    },
  })
}

function buildReminderEmail({
  name, groupName, dueDate, amount, groupUrl,
}: {
  name: string; groupName: string; dueDate: string; amount: string; groupUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #FAF7F2; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
    <div style="background: #0D6E5B; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">PocketCircle</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Community savings made simple</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #333; font-size: 16px;">Hi ${name},</p>
      <p style="color: #555; font-size: 15px;">
        Your contribution of <strong>${amount}</strong> to <strong>${groupName}</strong> is due on <strong>${dueDate}</strong>.
      </p>
      <div style="background: #E8F5F1; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #0D6E5B;">${amount}</p>
        <p style="margin: 4px 0 0; color: #555; font-size: 14px;">Due ${dueDate}</p>
      </div>
      <a href="${groupUrl}" style="display: block; background: #0D6E5B; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 500;">
        Log my payment
      </a>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
        PocketCircle · Community savings platform
      </p>
    </div>
  </div>
</body>
</html>`
}

function buildConfirmationEmail({
  name, groupName, amount, groupUrl,
}: {
  name: string; groupName: string; amount: string; groupUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #FAF7F2; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
    <div style="background: #0D6E5B; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">PocketCircle</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #333; font-size: 16px;">Hi ${name},</p>
      <p style="color: #555; font-size: 15px;">
        Great news! Your payment of <strong>${amount}</strong> to <strong>${groupName}</strong> has been confirmed by the group admin.
      </p>
      <div style="background: #E8F5F1; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 32px;">✅</p>
        <p style="margin: 8px 0 0; font-weight: bold; color: #0D6E5B;">Payment confirmed</p>
      </div>
      <a href="${groupUrl}" style="display: block; background: #0D6E5B; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 500;">
        View group
      </a>
    </div>
  </div>
</body>
</html>`
}
