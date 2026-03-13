'use client'

import { useState } from 'react'
import type { GigType } from '@/types'
import { Input } from '@/components/ui/input'

interface Filters {
  keyword: string
  gig_type: GigType | ''
  min_budget: string
  max_budget: string
}

interface JobFiltersProps {
  onChange: (filters: Filters) => void
}

const GIG_TYPES: { value: GigType; label: string }[] = [
  { value: 'SOFTWARE',    label: '💻 Software' },
  { value: 'COPYWRITING', label: '✍️ Copywriting' },
  { value: 'DATA_ENTRY',  label: '📊 Data Entry' },
  { value: 'TRANSLATION', label: '🌐 Translation' },
]

export function JobFilters({ onChange }: JobFiltersProps) {
  const [filters, setFilters] = useState<Filters>({ keyword: '', gig_type: '', min_budget: '', max_budget: '' })

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        placeholder="Search jobs..."
        value={filters.keyword}
        onChange={e => update({ keyword: e.target.value })}
        className="w-56"
      />

      <select
        value={filters.gig_type}
        onChange={e => update({ gig_type: e.target.value as GigType | '' })}
        className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
      >
        <option value="">All Types</option>
        {GIG_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Min $"
          value={filters.min_budget}
          onChange={e => update({ min_budget: e.target.value })}
          className="w-24"
          type="number"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          placeholder="Max $"
          value={filters.max_budget}
          onChange={e => update({ max_budget: e.target.value })}
          className="w-24"
          type="number"
        />
      </div>

      {(filters.keyword || filters.gig_type || filters.min_budget || filters.max_budget) && (
        <button
          onClick={() => update({ keyword: '', gig_type: '', min_budget: '', max_budget: '' })}
          className="text-sm text-muted-foreground hover:text-error transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
