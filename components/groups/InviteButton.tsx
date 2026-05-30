'use client'

import { useState } from 'react'
import { generateInviteUrl } from '@/lib/utils'

interface InviteButtonProps {
  inviteCode: string
  groupName: string
}

export function InviteButton({ inviteCode, groupName }: InviteButtonProps) {
  const [copied, setCopied] = useState(false)
  const url = generateInviteUrl(inviteCode)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on PocketCircle`,
          text: `You've been invited to join ${groupName}. Use code: ${inviteCode}`,
          url,
        })
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-brand-600 bg-brand-50 border border-brand-200 rounded-xl px-3 py-1.5 font-medium active:scale-95 transition-transform"
    >
      {copied ? (
        <>✅ Copied</>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Invite
        </>
      )}
    </button>
  )
}
