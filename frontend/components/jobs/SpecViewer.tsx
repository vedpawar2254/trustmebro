import type { JobSpec } from '@/types'
import { MilestoneCard } from './MilestoneCard'
import { Badge } from '@/components/ui/badge'

interface SpecViewerProps {
  spec: JobSpec
  gigType?: string
  gigSubtype?: string
}

export function SpecViewer({ spec, gigType, gigSubtype }: SpecViewerProps) {
  const subtypeLabel = gigSubtype?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        {gigType && <Badge variant="default">Gig Type: {gigType}</Badge>}
        {subtypeLabel && <Badge variant="muted">{subtypeLabel}</Badge>}
        {spec.is_locked && (
          <Badge variant="success">🔒 Spec Locked</Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">v{spec.version}</span>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Milestones ({spec.milestones.length})
        </h3>
        <div className="space-y-3">
          {spec.milestones.map((m, i) => (
            <MilestoneCard key={m.milestone_id} milestone={m} index={i} />
          ))}
        </div>
      </div>

      {/* Required Assets */}
      {spec.required_assets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Required Assets ({spec.required_assets.length})
          </h3>
          <div className="space-y-2">
            {spec.required_assets.map(asset => (
              <div key={asset.asset_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <span className={asset.is_delivered ? 'text-success' : 'text-muted'}>
                  {asset.is_delivered ? '✅' : '⬜'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">{asset.description}</div>
                </div>
                {asset.is_delivered && (
                  <Badge variant="success">Delivered</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarifications */}
      {spec.clarifications.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Spec Clarifications ({spec.clarifications.length})
          </h3>
          <div className="space-y-2">
            {spec.clarifications.map(cl => (
              <div key={cl.clarification_id} className="p-3 bg-info/5 border border-info/20 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Q: {cl.question}</div>
                <div className="text-sm font-medium text-foreground">A: {cl.answer}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Logged {new Date(cl.answered_at).toLocaleDateString()} · Binding
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
