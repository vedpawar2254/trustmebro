'use client'

import { useState } from 'react'
import type { Milestone } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  editable?: boolean
  onUpdate?: (updated: Milestone) => void
}

export function MilestoneCard({ milestone, index, editable = false, onUpdate }: MilestoneCardProps) {
  const [open, setOpen] = useState(index === 0)

  const vagueCount = milestone.criteria.filter(c => c.is_vague && !c.vague_resolved).length

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-secondary transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </div>
          <div>
            <div className="font-semibold text-foreground">{milestone.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Due {formatDistanceToNow(new Date(milestone.deadline), { addSuffix: true })} · {milestone.criteria.length} criteria
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vagueCount > 0 && (
            <Badge variant="warning">{vagueCount} flag{vagueCount > 1 ? 's' : ''}</Badge>
          )}
          <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 py-4 bg-background border-t border-border space-y-3">
          {milestone.criteria.map(criterion => (
            <div
              key={criterion.criterion_id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                criterion.is_vague && !criterion.vague_resolved
                  ? 'border-warning/40 bg-warning/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {criterion.is_vague && !criterion.vague_resolved ? (
                  <span className="text-warning text-sm">⚠️</span>
                ) : (
                  <span className="text-success text-sm">✓</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{criterion.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{criterion.description}</div>
                {criterion.is_vague && !criterion.vague_resolved && (
                  <div className="text-xs text-warning mt-1 font-medium">
                    Too vague to verify — must be defined specifically or moved to PFI-only
                  </div>
                )}
              </div>
              {criterion.weight != null && (
                <div className="text-xs text-muted-foreground shrink-0">
                  {Math.round(criterion.weight * 100)}%
                </div>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground font-medium mb-1">Submission type</div>
            <div className="flex flex-wrap gap-2">
              {milestone.submission_requirements.map((req, i) => (
                <Badge key={i} variant="muted">{req.type.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
