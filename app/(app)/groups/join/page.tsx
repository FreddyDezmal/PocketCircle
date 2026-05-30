'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function JoinGroupPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Invalid invite code')
    } else {
      router.push(`/groups/${data.groupId}`)
    }
  }

  return (
    <div className="px-4 pt-6">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join a group</h1>
        <p className="text-gray-500 text-sm">Enter the invite code shared by your group admin.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Invite code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC12345"
          autoCapitalize="characters"
          maxLength={12}
          error={error}
        />
        <Button type="submit" size="lg" loading={loading} disabled={!code.trim()}>
          Join group
        </Button>
      </form>
    </div>
  )
}
