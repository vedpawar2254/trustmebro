'use client'

import { useState } from 'react'
import type { AIAction } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AIInterceptBannerProps {
  action: AIAction
  onRespond?: (response: string) => void
}

export function AIInterceptBanner({ action, onRespond }: AIInterceptBannerProps) {
  const [response, setResponse] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!response.trim()) return
    onRespond?.(response)
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3 text-sm text-success font-medium">
        ✅ Spec clarification logged and appended. Both parties notified.
      </div>
    )
  }

  return (
    <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-primary font-semibold text-sm">🤖 AI Mediator Action Required</span>
      </div>
      <p className="text-sm text-foreground">{action.ai_response}</p>

      {action.requires_response && action.response_type === 'spec_clarification' && (
        <div className="flex gap-2">
          <Input
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Your binding answer..."
            className="flex-1"
          />
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!response.trim()}>
            Confirm as Spec Clarification
          </Button>
        </div>
      )}

      {action.requires_response && action.response_type === 'change_request' && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm">Submit Change Request</Button>
          <Button variant="secondary" size="sm">Cancel</Button>
        </div>
      )}
    </div>
  )
}
