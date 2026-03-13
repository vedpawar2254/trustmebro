import type { Bid } from '@/types'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface BidCardProps {
  bid: Bid
  onAccept?: (bid: Bid) => void
  showAccept?: boolean
}

export function BidCard({ bid, onAccept, showAccept = false }: BidCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">{bid.freelancer_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-foreground">PFI {bid.freelancer_pfi} 🏆</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{bid.cover_letter}</p>

      <div className="flex items-center gap-4 text-sm pt-1 border-t border-border">
        {bid.proposed_budget != null && (
          <div>
            <span className="text-muted-foreground">Proposed: </span>
            <span className="font-semibold text-primary">${bid.proposed_budget.toLocaleString()}</span>
          </div>
        )}
        {bid.proposed_deadline && (
          <div>
            <span className="text-muted-foreground">By: </span>
            <span className="font-medium text-foreground">
              {new Date(bid.proposed_deadline).toLocaleDateString()}
            </span>
          </div>
        )}
        {showAccept && onAccept && (
          <Button
            variant="primary"
            size="sm"
            className="ml-auto"
            onClick={() => onAccept(bid)}
          >
            Accept Bid
          </Button>
        )}
      </div>
    </div>
  )
}
