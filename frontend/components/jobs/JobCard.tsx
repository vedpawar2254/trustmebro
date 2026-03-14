'use client';

import Link from 'next/link';
import { Job } from '@/types';
import { GigTypeBadge } from '@/components/jobs/GigTypeBadge';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  linkPrefix?: string;
}

export function JobCard({ job, linkPrefix = '/freelancer/jobs' }: JobCardProps) {
  const publishedDate = job.published_at ? new Date(job.published_at) : new Date(job.created_at);

  return (
    <Link 
      href={`${linkPrefix}/${job.job_id}`}
      className="dash-card flex flex-col gap-4 hover:border-[#7c3aed66] transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-width-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[#e2d9f3] group-hover:text-[#c4b5fd] transition-colors truncate">
              {job.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#6b5a8a]">By {job.employer_name}</span>
            <span className="text-[#2d1f45]">•</span>
            <div className="flex items-center gap-1 bg-[#1d1233] border border-[#2d1f45] px-1.5 py-0.5 rounded text-[10px]">
              <span className="text-[#6b5a8a]">PFI</span>
              <span className="text-[#a78bfa] font-bold">{job.employer_pfi ?? '--'}</span>
            </div>
          </div>
        </div>
        
        <GigTypeBadge gigType={job.gig_type} gigSubtype={job.gig_subtype} />
      </div>

      <p className="text-xs text-[#7b6a96] line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      <div className="mt-auto pt-4 border-t border-[#2d1f45] flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#4a3866] font-bold">BUDGET</span>
          <span className="text-sm font-bold text-[#c4b5fd]">
            ${job.budget_range.min.toLocaleString()} - ${job.budget_range.max.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#4a3866] font-bold text-right">DEADLINE</span>
          <span className="text-[11px] text-[#6b5a8a]">
            {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
