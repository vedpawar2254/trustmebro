'use client';

import Link from 'next/link';
import { Job } from '@/types';
import { GigTypeBadge } from './GigTypeBadge';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>By {job.employer_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              PFI: {job.employer_pfi ?? '--'}
              {' '}
              <span>🏆</span>
            </span>
          </div>
        </div>
        <GigTypeBadge gigType={job.gig_type} gigSubtype={job.gig_subtype} />
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-gray-900 font-semibold">
            ${job.budget_range.min.toLocaleString()} - ${job.budget_range.max.toLocaleString()}
          </div>
          <div className="text-gray-600">
            Due {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
          </div>
        </div>

        <Link
          href={`/freelancer/jobs/${job.job_id}`}
          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover active:bg-primary-active text-sm"
        >
          View Spec
        </Link>
      </div>
    </div>
  );
}
