'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUserRole, selectUser } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeterRing } from '@/components/ui/meter-ring';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLayout } from '../../freelancer/dashboard/DashboardLayout';
import { dashboardService, type Job, type Bid } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  stats: {
    active_jobs: number;
    pending_bids?: number;
    total_escrow?: number;
    completed_jobs: number;
    pending_submissions?: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
    link: string;
  }>;
  active_jobs: Job[];
  pending_bids: Bid[];
}

export default function EmployerDashboard() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== 'employer') {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getEmployerDashboard();
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, role, router]);

  if (!user || role !== 'employer') {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Use real data or defaults
  const stats = data?.stats || {
    active_jobs: 0,
    pending_bids: 0,
    total_escrow: 0,
    completed_jobs: 0,
  };

  return (
    <DashboardLayout>
      {/* App Header */}
      <div className="px-8 py-6 border-b border-border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between z-10">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.name}!
        </h1>
        <Link href="/employer/post-job" className="mt-4 sm:mt-0">
          <Button variant="primary">+ Post New Job</Button>
        </Link>
      </div>

      {/* Main scrollable content block */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-8">

          {/* Stats / Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MeterRing
              label="Active Jobs"
              value={stats.active_jobs}
              description="jobs in progress"
              progress={Math.min(stats.active_jobs * 20, 100)}
            />
            <MeterRing
              label="Pending Bids"
              value={stats.pending_bids ?? 0}
              description="waiting for review"
              progress={Math.min((stats.pending_bids ?? 0) * 10, 100)}
            />
            <MeterRing
              label="Escrow Locked"
              value={`$${(stats.total_escrow ?? 0).toLocaleString()}`}
              description="total in escrow"
              progress={Math.min((stats.total_escrow ?? 0) / 100, 100)}
            />
            <MeterRing
              label="Completed"
              value={stats.completed_jobs}
              description="jobs done"
              progress={Math.min(stats.completed_jobs * 10, 100)}
            />
          </div>

          {/* Active Jobs */}
          <Card className="rounded-xl shadow-sm bg-card mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Jobs</CardTitle>
                <Link href="/employer/jobs" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.active_jobs && data.active_jobs.length > 0 ? (
                <div className="space-y-4">
                  {data.active_jobs.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/employer/jobs/${job.id}`}
                      className="block p-4 bg-muted/20 border border-border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground mb-1">{job.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {job.gig_type} • ${job.budget_min}-${job.budget_max}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'IN_PROGRESS' ? 'bg-info/20 text-info' :
                            job.status === 'ESCROW_FUNDED' ? 'bg-success/20 text-success' :
                            job.status === 'PUBLISHED' ? 'bg-warning/20 text-warning' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                          {job.assigned_freelancer_name && (
                            <div className="text-xs text-muted-foreground mt-1">
                              with {job.assigned_freelancer_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📋"
                  title="No active jobs"
                  description="Post your first job to get started"
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Bids */}
          <Card className="rounded-xl shadow-sm bg-card mb-8">
            <CardHeader>
              <CardTitle>Pending Bids</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.pending_bids && data.pending_bids.length > 0 ? (
                <div className="space-y-4">
                  {data.pending_bids.slice(0, 5).map((bid) => (
                    <div
                      key={bid.id}
                      className="p-4 bg-muted/20 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground mb-1">
                            {bid.freelancer_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            PFI: {bid.freelancer_pfi} • {bid.estimated_days} days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            ${bid.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {bid.message}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link href={`/employer/jobs/${bid.job_id}?bid=${bid.id}`}>
                          <Button variant="primary" size="sm">Review Bid</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📩"
                  title="No pending bids"
                  description="Bids will appear here when freelancers apply to your jobs"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-xl shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recent_activity && data.recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {data.recent_activity.map((activity, idx) => (
                    <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg">
                      <div className="font-semibold text-foreground mb-1">{activity.title}</div>
                      <div className="text-sm text-muted-foreground mb-2">{activity.subtitle}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        <Link href={activity.link} className="text-primary text-sm font-semibold hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🕐"
                  title="No recent activity"
                  description="Activity will appear here as you use the platform"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
