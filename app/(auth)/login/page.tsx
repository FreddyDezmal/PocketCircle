'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-6">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-brand-600 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
      <p className="text-sm text-gray-500 mb-6">We'll send you a magic link — no password needed.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={error}
        />
        <Button type="submit" size="lg" loading={loading}>
          Send magic link
        </Button>
      </form>
      <p className="text-center text-xs text-gray-400 mt-6">
        By signing in, you agree to our terms and privacy policy.
      </p>
    </>
  )
}
