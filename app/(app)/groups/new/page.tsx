'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    frequency: 'MONTHLY',
    currency: 'ZAR',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
    } else {
      router.push(`/groups/${data.id}`)
    }
  }

  return (
    <div className="px-4 pt-6">
      {/* Back */}
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a group</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Group name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Mzansi Sisters Stokvel"
          required
          maxLength={60}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What is this group saving for?"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Amount"
              type="number"
              value={form.contributionAmount}
              onChange={e => set('contributionAmount', e.target.value)}
              placeholder="500"
              min="1"
              required
            />
          </div>
          <div className="w-28 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              className="w-full h-[50px] px-3 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ZAR">ZAR</option>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="NGN">NGN</option>
              <option value="GHS">GHS</option>
              <option value="BWP">BWP</option>
              <option value="ZMW">ZMW</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Contribution frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {['WEEKLY', 'BIWEEKLY', 'MONTHLY'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => set('frequency', f)}
                className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.frequency === f
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                }`}
              >
                {f === 'BIWEEKLY' ? 'Bi-weekly' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="First contribution date"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
          required
          hint="When should the first payment be due?"
        />

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

        <Button type="submit" size="lg" loading={loading} className="mt-2">
          Create group
        </Button>
      </form>
    </div>
  )
}
