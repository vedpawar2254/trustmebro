'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '@/app/freelancer/dashboard/DashboardLayout';
import { jobService, type Job } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

const STATUS_META: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'muted' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  PUBLISHED: { label: 'Published', variant: 'default' },
  ASSIGNED: { label: 'Assigned', variant: 'info' },
  ESCROW_FUNDED: { label: 'Escrow Funded', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  DISPUTED: { label: 'Disputed', variant: 'error' },
};

export default function EmployerJobsPage() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'employer') {
      router.push('/login');
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobService.getMyJobs();
        if (response.success && response.data) {
          setJobs(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, role, router]);

  if (!user || role !== 'employer') return null;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-background flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Link href="/employer/post-job">
          <Button variant="primary">+ Post New Job</Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No jobs yet"
              description="Post your first job and let AI generate a structured spec."
            />
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const meta = STATUS_META[job.status] ?? { label: job.status, variant: 'muted' as const };
                return (
                  <Link
                    key={job.id}
                    href={`/employer/jobs/${job.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                              <Badge variant="muted">{job.gig_type}</Badge>
                              {job.gig_subtype && (
                                <Badge variant="muted">{job.gig_subtype.replace(/_/g, ' ')}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg text-foreground mb-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {job.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span>
                                ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                              </span>
                              <span>•</span>
                              <span>
                                {job.deadline
                                  ? `Due ${formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}`
                                  : 'Flexible'}
                              </span>
                              {job.assigned_freelancer_name && (
                                <>
                                  <span>•</span>
                                  <span>Assigned to {job.assigned_freelancer_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
