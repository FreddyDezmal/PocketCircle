'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface LogPaymentButtonProps {
  scheduleId: string
  groupId: string
  amount: number
  currency: string
}

export function LogPaymentButton({ scheduleId, groupId, amount, currency }: LogPaymentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amountPaid, setAmountPaid] = useState(String(amount))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const res = await fetch(`/api/groups/${groupId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId,
        amountPaid: Number(amountPaid),
        notes,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Failed to log payment')
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium bg-brand-600 text-white rounded-xl px-3 py-1.5 active:scale-95 transition-transform"
      >
        Log payment
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setOpen(false)}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Log my payment</h2>
        <p className="text-sm text-gray-500 mb-5">
          Enter the amount you paid. The admin will confirm it.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Amount paid</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. EFT reference: 12345"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
