'use client';

import type { JobSpec } from '@/types'
import { MilestoneCard } from './MilestoneCard'

interface SpecViewerProps {
  spec: JobSpec
  gigType?: string
  gigSubtype?: string
}

export function SpecViewer({ spec }: SpecViewerProps) {
  return (
    <div className="space-y-8">
      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#c4b5fd]">
            Project Milestones
          </h3>
          <span className="text-[10px] text-[#4a3866] font-bold bg-[#1d1233] px-2 py-0.5 rounded border border-[#2d1f45]">
            {spec.milestones.length} STAGES
          </span>
        </div>
        
        <div className="space-y-4">
          {spec.milestones.map((m, i) => (
            <MilestoneCard key={m.milestone_id} milestone={m} index={i} />
          ))}
        </div>
      </div>

      {/* Required Assets */}
      {spec.required_assets.length > 0 && (
        <div className="pt-6 border-t border-[#2d1f45]">
          <h3 className="text-sm font-bold text-[#c4b5fd] mb-4">
            Required Assets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spec.required_assets.map(asset => (
              <div key={asset.asset_id} className="flex items-center gap-3 p-3 bg-[#130d22] border border-[#2d1f45] rounded-xl hover:border-[#7c3aed44] transition-all group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${asset.is_delivered ? 'bg-[#16a34a15] border-[#16a34a33] text-[#4ade80]' : 'bg-[#1d1233] border-[#2d1f45] text-[#6b5a8a]'}`}>
                  {asset.is_delivered ? '✓' : '•'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#e2d9f3] truncate">{asset.name}</div>
                  <div className="text-[10px] text-[#6b5a8a] truncate">{asset.description}</div>
                </div>
                {asset.is_delivered && (
                  <span className="text-[9px] font-bold text-[#4ade80] uppercase tracking-tighter">DELIVERED</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarifications */}
      {spec.clarifications.length > 0 && (
        <div className="pt-6 border-t border-[#2d1f45]">
          <h3 className="text-sm font-bold text-[#c4b5fd] mb-4">
            Clarifications
          </h3>
          <div className="space-y-3">
            {spec.clarifications.map(cl => (
              <div key={cl.clarification_id} className="p-4 bg-[#7c3aed08] border border-[#7c3aed22] rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div className="text-[10px] font-bold text-[#6b5a8a] mb-2 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#7c3aed]" />
                  Verified Definition
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#4a3866] block mb-1">QUESTION</span>
                    <p className="text-xs text-[#7b6a96] italic">"{cl.question}"</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#4a3866] block mb-1">RESOLUTION</span>
                    <p className="text-xs text-[#e2d9f3] font-medium leading-relaxed">{cl.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
