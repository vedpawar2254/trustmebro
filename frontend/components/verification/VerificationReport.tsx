import type { VerificationReport as VReport } from '@/types'
import { ScoreRing } from './ScoreRing'
import { CriterionBreakdown } from './CriterionBreakdown'
import { Button } from '@/components/ui/button'

interface VerificationReportProps {
  report: VReport
  onResubmit?: () => void
  isFreelancer?: boolean
}

export function VerificationReport({ report, onResubmit, isFreelancer }: VerificationReportProps) {
  const decisionMeta = {
    AUTO_RELEASE: { label: 'Payment Auto-Released', color: 'text-success', bg: 'bg-success/10 border-success/30', icon: '💸' },
    HOLD:         { label: 'Payment On Hold',        color: 'text-warning', bg: 'bg-warning/10 border-warning/30', icon: '⏸️' },
    DISPUTE:      { label: 'Flagged for Dispute',    color: 'text-error',   bg: 'bg-error/10 border-error/30',     icon: '⚠️' },
  }[report.payment_decision]

  return (
    <div className="space-y-6">
      {/* Score + Decision */}
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={report.overall_score} size={140} />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${decisionMeta.bg} ${decisionMeta.color}`}>
            <span>{decisionMeta.icon}</span>
            <span>{decisionMeta.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {report.gig_type} · {report.gig_subtype?.replace(/_/g, ' ')} · Milestone {report.milestone_id}
          </div>
          <div className="text-xs text-muted-foreground">
            Verified {new Date(report.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {report.feedback_for_freelancer && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Feedback</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.feedback_for_freelancer}</p>
          {isFreelancer && report.resubmissions_remaining > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {report.resubmissions_remaining} resubmission{report.resubmissions_remaining > 1 ? 's' : ''} remaining
              </span>
              {onResubmit && (
                <Button variant="primary" size="sm" onClick={onResubmit}>
                  Resubmit Work
                </Button>
              )}
            </div>
          )}
          {isFreelancer && report.resubmissions_remaining === 0 && (
            <p className="mt-3 text-xs text-error font-medium">No resubmissions remaining.</p>
          )}
        </div>
      )}

      {/* Criteria */}
      <div className="bg-card border border-border rounded-lg p-5">
        <CriterionBreakdown criteria={report.criteria} pfiSignals={report.pfi_signals} />
      </div>
    </div>
  )
}
