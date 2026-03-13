import type { Escrow } from '@/types'

interface EscrowWidgetProps {
  escrow: Escrow
}

const STATUS_META = {
  FUNDED:   { label: 'Funded',   color: 'text-success', bg: 'bg-success/10', icon: '🔒' },
  HELD:     { label: 'On Hold',  color: 'text-warning', bg: 'bg-warning/10', icon: '⏸️' },
  RELEASED: { label: 'Released', color: 'text-info',    bg: 'bg-info/10',    icon: '💸' },
  REFUNDED: { label: 'Refunded', color: 'text-error',   bg: 'bg-error/10',   icon: '↩️' },
}

export function EscrowWidget({ escrow }: EscrowWidgetProps) {
  const meta = STATUS_META[escrow.status]
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${meta.bg}`}>
      <span className="text-xl">{meta.icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">Escrow</div>
        <div className="font-bold text-foreground text-lg">
          ${escrow.amount.toLocaleString()} {escrow.currency}
        </div>
      </div>
      <span className={`ml-auto text-sm font-semibold ${meta.color}`}>{meta.label}</span>
    </div>
  )
}
