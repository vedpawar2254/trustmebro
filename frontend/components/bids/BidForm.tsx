'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface BidFormProps {
  jobId: string
  onSubmit?: (data: { cover_letter: string; proposed_budget: number; proposed_deadline: string }) => void
}

export function BidForm({ jobId, onSubmit }: BidFormProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (coverLetter.length < 50) {
      setError('Cover letter must be at least 50 characters.')
      return
    }
    setError('')
    onSubmit?.({ cover_letter: coverLetter, proposed_budget: Number(budget), proposed_deadline: deadline })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-5 text-center">
        <div className="text-2xl mb-2">✅</div>
        <div className="font-semibold text-foreground">Bid Placed!</div>
        <div className="text-sm text-muted-foreground mt-1">The employer will review your bid and get back to you.</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cover_letter">Cover Letter</Label>
        <Textarea
          id="cover_letter"
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          placeholder="Describe your experience and why you're the right fit for this project..."
          rows={5}
          className="mt-1"
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${coverLetter.length < 50 ? 'text-muted-foreground' : 'text-success'}`}>
            {coverLetter.length} / 50 min
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="budget">Your Price ($)</Label>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="4500"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="deadline">Delivery By</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" variant="primary" className="w-full">
        Place Bid
      </Button>
    </form>
  )
}
