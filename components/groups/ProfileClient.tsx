'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface ProfileClientProps {
  user: { id: string; displayName: string; email: string }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.displayName)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function saveProfile() {
    setSaving(true)
    await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function signOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col gap-3">
      {editing ? (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Edit profile</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Display name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={saveProfile} loading={saving} className="flex-1">Save</Button>
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" size="lg" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      )}

      <Button variant="danger" size="lg" onClick={signOut} loading={signingOut}>
        Sign out
      </Button>
    </div>
  )
}
