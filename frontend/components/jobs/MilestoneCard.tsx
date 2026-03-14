'use client'

import { useState } from 'react'
import type { Milestone } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  editable?: boolean
  onUpdate?: (updated: Milestone) => void
}

export function MilestoneCard({ milestone, index }: MilestoneCardProps) {
  const [open, setOpen] = useState(index === 0)

  const vagueCount = milestone.criteria.filter(c => c.is_vague && !c.vague_resolved).length

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${open ? 'border-[#7c3aed44] bg-[#1a1030]' : 'border-[#2d1f45] bg-[#130d22]'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 transition-all duration-300 ${open ? 'bg-[#7c3aed] text-white shadow-[0_0_15px_#7c3aed44]' : 'bg-[#1d1233] text-[#6b5a8a] border border-[#2d1f45]'}`}>
            {index + 1}
          </div>
          <div>
            <div className={`font-bold transition-colors ${open ? 'text-[#e2d9f3]' : 'text-[#7b6a96] group-hover:text-[#e2d9f3]'}`}>
              {milestone.title}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#4a3866] font-bold mt-1">
              Due {formatDistanceToNow(new Date(milestone.deadline), { addSuffix: true })} • {milestone.criteria.length} Criteria
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vagueCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f59e0b15] border border-[#f59e0b22] text-[#fbbf24] text-[9px] font-black uppercase tracking-tighter shadow-inner">
              <span className="animate-pulse">⚠️</span> {vagueCount} Flags
            </div>
          )}
          <div className={`transition-transform duration-300 ${open ? 'rotate-180 text-[#7c3aed]' : 'text-[#4a3866]'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-6 pt-2 space-y-4 animate-dashFadeIn">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2d1f45] to-transparent mb-4" />
          
          <div className="space-y-2">
            {milestone.criteria.map(criterion => (
              <div
                key={criterion.criterion_id}
                className={`flex items-start gap-4 p-4 rounded-xl border group/row transition-all ${
                  criterion.is_vague && !criterion.vague_resolved
                    ? 'border-[#f59e0b22] bg-[#f59e0b08] hover:bg-[#f59e0b10]'
                    : 'border-[#2d1f45] bg-[#1d1233] hover:border-[#7c3aed33]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {criterion.is_vague && !criterion.vague_resolved ? (
                    <div className="w-5 h-5 rounded-full bg-[#f59e0b22] flex items-center justify-center text-[10px] text-[#fbbf24]">!</div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#16a34a22] flex items-center justify-center text-[10px] text-[#4ade80]">✓</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#e2d9f3] group-hover/row:text-[#c4b5fd] transition-colors">{criterion.name}</div>
                  <div className="text-[11px] text-[#6b5a8a] mt-1 leading-relaxed">{criterion.description}</div>
                  {criterion.is_vague && !criterion.vague_resolved && (
                    <div className="mt-2 text-[10px] text-[#fbbf24] font-bold bg-[#f59e0b15] px-2 py-1 rounded inline-block">
                      Too vague for automated verification — clarification required.
                    </div>
                  )}
                </div>
                {criterion.weight != null && (
                  <div className="text-[10px] font-black text-[#4a3866] bg-[#130d22] px-1.5 py-0.5 rounded border border-[#2d1f45]">
                    {Math.round(criterion.weight * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#4a3866] uppercase tracking-widest pl-1">Submission Deliverables</span>
            <div className="flex flex-wrap gap-2">
              {milestone.submission_requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#251840] border border-[#3d2a5c] text-[10px] font-bold text-[#a78bfa]">
                  <span className="opacity-60">
                    {req.type === 'github_link' ? '🔗' : req.type === 'file_upload' ? '📁' : '📝'}
                  </span>
                  {req.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
