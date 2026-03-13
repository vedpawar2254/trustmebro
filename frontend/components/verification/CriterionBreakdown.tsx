import type { Criterion, PFISignal } from '@/types'

const STATUS_META = {
  PASS:    { icon: '✅', label: 'Pass',    color: 'text-success', bg: 'bg-success/5 border-success/20' },
  FAIL:    { icon: '❌', label: 'Fail',    color: 'text-error',   bg: 'bg-error/5 border-error/20' },
  PARTIAL: { icon: '⚠️', label: 'Partial', color: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
  PENDING: { icon: '⏳', label: 'Pending', color: 'text-muted-foreground', bg: 'bg-border/30 border-border' },
}

interface CriterionBreakdownProps {
  criteria: Criterion[]
  pfiSignals: PFISignal[]
}

export function CriterionBreakdown({ criteria, pfiSignals }: CriterionBreakdownProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Criteria Breakdown</h3>
        <div className="space-y-2">
          {criteria.map((c, i) => {
            const meta = STATUS_META[c.status] ?? STATUS_META.PENDING
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${meta.bg}`}>
                <span className="text-base shrink-0 mt-0.5">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                </div>
                {c.weight != null && (
                  <span className="text-xs text-muted-foreground shrink-0">{Math.round(c.weight * 100)}%</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {pfiSignals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">PFI Signals (informational only)</h3>
          <div className="space-y-2">
            {pfiSignals.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-warning/5 border-warning/20">
                <span className="text-base shrink-0 mt-0.5">
                  {s.status === 'WARNING' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
