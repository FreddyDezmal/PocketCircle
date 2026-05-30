'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface PayoutSlot {
  id: string
  userId: string
  slotOrder: number
  scheduledDate: string | null
  paidDate: string | null
  status: string
  userName: string
}

interface Member {
  id: string
  displayName: string
}

interface ManagePayoutsClientProps {
  groupId: string
  members: Member[]
  payoutSlots: PayoutSlot[]
  contributionAmount: number
  currency: string
  frequency: string
}

export function ManagePayoutsClient({
  groupId,
  members,
  payoutSlots,
  contributionAmount,
  currency,
  frequency,
}: ManagePayoutsClientProps) {
  const router = useRouter()
  const [slots, setSlots] = useState<PayoutSlot[]>(payoutSlots)
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  // Members not yet assigned a slot
  const assignedIds = new Set(slots.map(s => s.userId))
  const unassigned = members.filter(m => !assignedIds.has(m.id))

  function moveUp(index: number) {
    if (index === 0) return
    const newSlots = [...slots]
    ;[newSlots[index - 1], newSlots[index]] = [newSlots[index], newSlots[index - 1]]
    setSlots(newSlots.map((s, i) => ({ ...s, slotOrder: i + 1 })))
  }

  function moveDown(index: number) {
    if (index === slots.length - 1) return
    const newSlots = [...slots]
    ;[newSlots[index], newSlots[index + 1]] = [newSlots[index + 1], newSlots[index]]
    setSlots(newSlots.map((s, i) => ({ ...s, slotOrder: i + 1 })))
  }

  function addMember(member: Member) {
    const newSlot: PayoutSlot = {
      id: `new-${member.id}`,
      userId: member.id,
      userName: member.displayName,
      slotOrder: slots.length + 1,
      scheduledDate: null,
      paidDate: null,
      status: 'PENDING',
    }
    setSlots([...slots, newSlot])
  }

  async function saveOrder() {
    setSaving(true)
    await fetch(`/api/groups/${groupId}/payouts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: slots.map(s => ({
          userId: s.userId,
          slotOrder: s.slotOrder,
          scheduledDate: s.scheduledDate,
        })),
      }),
    })
    setSaving(false)
    router.refresh()
  }

  async function markPaid(slotId: string) {
    setMarkingId(slotId)
    await fetch(`/api/groups/${groupId}/payouts/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID', paidDate: new Date().toISOString() }),
    })
    setMarkingId(null)
    router.refresh()
  }

  const payoutValue = contributionAmount * members.length

  return (
    <div className="flex flex-col gap-4">
      {/* Info */}
      <div className="bg-brand-50 rounded-xl p-3 text-sm text-brand-700">
        Each payout is worth <strong>{formatCurrency(payoutValue, currency)}</strong> ({members.length} members × {formatCurrency(contributionAmount, currency)})
      </div>

      {/* Slot list */}
      {slots.length > 0 && (
        <div className="flex flex-col gap-2">
          {slots.map((slot, index) => (
            <div key={slot.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                slot.status === 'PAID' ? 'bg-green-100 text-green-700' :
                index === 0 ? 'bg-brand-600 text-white' :
                'bg-white text-gray-500 border border-gray-200'
              }`}>
                {slot.slotOrder}
              </span>
              <Avatar name={slot.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{slot.userName}</p>
                {slot.scheduledDate && (
                  <p className="text-xs text-gray-400">{formatDateShort(slot.scheduledDate)}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={slot.status} />
                {slot.status === 'PENDING' && (
                  <>
                    <button onClick={() => moveUp(index)} className="p-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button onClick={() => moveDown(index)} className="p-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => markPaid(slot.id)}
                      disabled={markingId === slot.id}
                      className="text-xs text-green-700 border border-green-300 bg-green-50 rounded-lg px-2 py-1"
                    >
                      Paid
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add unassigned members */}
      {unassigned.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Add members to payout order:</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(m => (
              <button
                key={m.id}
                onClick={() => addMember(m)}
                className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5 hover:border-brand-300"
              >
                <Avatar name={m.displayName} size="sm" />
                {m.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button onClick={saveOrder} loading={saving} size="lg">
        Save payout order
      </Button>
    </div>
  )
}
