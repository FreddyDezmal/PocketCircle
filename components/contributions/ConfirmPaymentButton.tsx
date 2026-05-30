'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConfirmPaymentButtonProps {
  contributionId: string
  memberName: string
  groupId: string
}

export function ConfirmPaymentButton({ contributionId, memberName, groupId }: ConfirmPaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    await fetch(`/api/groups/${groupId}/contributions/${contributionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
    setLoading(false)
    router.refresh()
  }

  async function reject() {
    setLoading(true)
    await fetch(`/api/groups/${groupId}/contributions/${contributionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'MISSED' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={confirm}
        disabled={loading}
        className="text-xs text-green-700 border border-green-300 bg-green-50 rounded-lg px-2 py-1 disabled:opacity-50"
      >
        ✓
      </button>
      <button
        onClick={reject}
        disabled={loading}
        className="text-xs text-red-700 border border-red-300 bg-red-50 rounded-lg px-2 py-1 disabled:opacity-50"
      >
        ✗
      </button>
    </div>
  )
}
