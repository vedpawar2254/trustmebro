'use client'

import { useState } from 'react'

interface BidFormProps {
  jobId: string
  onSubmit?: (data: { cover_letter: string; proposed_budget: number; proposed_deadline: string }) => void
}

export function BidForm({ onSubmit }: BidFormProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (coverLetter.length < 50) {
      setError('Brief must be at least 50 characters.')
      return
    }
    setError('')
    onSubmit?.({ cover_letter: coverLetter, proposed_budget: Number(budget), proposed_deadline: deadline })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-[#16a34a10] border border-[#16a34a33] rounded-xl p-6 text-center animate-dashFadeIn">
        <div className="w-12 h-12 bg-[#16a34a22] rounded-full flex items-center justify-center text-xl mx-auto mb-3 text-[#4ade80]">
          ✓
        </div>
        <div className="font-bold text-[#e2d9f3]">Bid Successfully Placed</div>
        <p className="text-[11px] text-[#6b5a8a] mt-2 leading-relaxed">
          The client has been notified. You'll receive a message if they choose to proceed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="cover_letter" className="text-[10px] font-bold text-[#4a3866] uppercase tracking-widest pl-1">
          Proposal Brief
        </label>
        <textarea
          id="cover_letter"
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          placeholder="I will deliver high quality results because..."
          rows={4}
          className="w-full bg-[#130d22] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-[#e2d9f3] outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c] resize-none"
        />
        <div className="flex justify-end pr-1">
          <span className={`text-[9px] font-bold tracking-tighter ${coverLetter.length < 50 ? 'text-[#4a3866]' : 'text-[#4ade80]'}`}>
            {coverLetter.length} / 50 MIN
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="budget" className="text-[10px] font-bold text-[#4a3866] uppercase tracking-widest pl-1">
             Your Bid ($)
          </label>
          <input
            id="budget"
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="500"
            className="w-full bg-[#130d22] border border-[#2d1f45] rounded-xl px-4 py-2.5 text-sm text-[#e2d9f3] outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c]"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="deadline" className="text-[10px] font-bold text-[#4a3866] uppercase tracking-widest pl-1">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full bg-[#130d22] border border-[#2d1f45] rounded-xl px-4 py-2.5 text-sm text-[#e2d9f3] outline-none focus:border-[#7c3aed44] transition-all"
          />
        </div>
      </div>

      {error && <p className="text-[10px] text-[#fbbf24] font-bold bg-[#f59e0b15] px-2 py-1.5 rounded-lg border border-[#f59e0b22] text-center">{error}</p>}

      <button 
        type="submit" 
        className="w-full py-3 bg-[#1d1233] border border-[#2d1f45] text-[#a78bfa] rounded-xl font-bold text-sm hover:bg-[#251840] hover:border-[#7c3aed44] hover:text-[#c4b5fd] transition-all shadow-sm"
      >
        Send Proposal
      </button>
    </form>
  )
}
