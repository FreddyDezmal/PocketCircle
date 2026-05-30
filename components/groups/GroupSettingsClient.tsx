'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'

interface Member {
  id: string
  userId: string
  displayName: string
  email: string
  role: string
  joinedAt: string
  isCurrentUser: boolean
}

interface GroupSettingsClientProps {
  group: { id: string; name: string; description: string; inviteCode: string; isOwner: boolean }
  members: Member[]
}

export function GroupSettingsClient({ group, members }: GroupSettingsClientProps) {
  const router = useRouter()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function saveSettings() {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    setSaving(false)
    if (res.ok) {
      setSuccess('Settings saved!')
      router.refresh()
    } else {
      setError('Failed to save settings')
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from the group?')) return
    setRemovingId(memberId)
    await fetch(`/api/groups/${group.id}/members/${memberId}`, { method: 'DELETE' })
    setRemovingId(null)
    router.refresh()
  }

  async function promoteToAdmin(memberId: string) {
    await fetch(`/api/groups/${group.id}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Group info */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Group info</h2>
        <div className="flex flex-col gap-3">
          <Input label="Group name" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button onClick={saveSettings} loading={saving} size="md">
            Save changes
          </Button>
        </div>
      </Card>

      {/* Invite code */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Invite code</h2>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
          <code className="flex-1 text-lg font-mono font-bold text-brand-700 tracking-widest">
            {group.inviteCode}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/join/${group.inviteCode}`
              )
            }}
            className="text-xs text-brand-600 font-medium bg-white border border-brand-200 rounded-lg px-3 py-1.5"
          >
            Copy link
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Share this code so members can join the group.</p>
      </Card>

      {/* Members */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Members ({members.length})</h2>
        <div className="flex flex-col divide-y divide-gray-50">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={member.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {member.displayName}
                  {member.isCurrentUser && <span className="text-gray-400"> (you)</span>}
                </p>
                <p className="text-xs text-gray-400">{member.role.toLowerCase()} · joined {new Date(member.joinedAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}</p>
              </div>
              {group.isOwner && !member.isCurrentUser && (
                <div className="flex gap-1.5">
                  {member.role === 'MEMBER' && (
                    <button
                      onClick={() => promoteToAdmin(member.id)}
                      className="text-xs text-brand-600 border border-brand-200 rounded-lg px-2 py-1"
                    >
                      Make admin
                    </button>
                  )}
                  <button
                    onClick={() => removeMember(member.id)}
                    disabled={removingId === member.id}
                    className="text-xs text-red-600 border border-red-200 rounded-lg px-2 py-1 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
