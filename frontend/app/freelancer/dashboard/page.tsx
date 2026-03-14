'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUserRole, selectUser, selectUserPFI } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLayout } from './DashboardLayout';
import { dashboardService, type Job } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  stats: {
    active_jobs: number;
    total_earned?: number;
    pending_submissions: number;
    completed_jobs: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
    link: string;
  }>;
  active_projects: Job[];
  available_jobs: Job[];
}

export default function FreelancerDashboard() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== 'freelancer') {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getFreelancerDashboard();
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

  if (!user || role !== 'freelancer') {
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
    total_earned: 0,
    pending_submissions: 0,
    completed_jobs: 0,
  };

  return (
    <DashboardLayout>
      {/* App Header */}
      <div className="px-8 py-6 border-b border-border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between z-10">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.name}!
        </h1>
        <Link href="/freelancer/jobs" className="mt-4 sm:mt-0">
          <Button variant="primary">Browse Jobs</Button>
        </Link>
      </div>

      {/* Main scrollable content block */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-8">

          {/* PFI Score Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-hover text-white px-6 py-5 rounded-xl mb-8 flex items-center gap-4 shadow-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
            <div className="flex-1">
              <div className="text-sm opacity-90 uppercase tracking-wide font-medium">Your PFI Score</div>
              <div className="text-5xl font-bold">{pfi ?? '--'}</div>
            </div>
            <div className="text-right max-w-xs">
              <p className="text-sm opacity-90">
                Higher scores unlock more job opportunities and increase your visibility to employers
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Active Projects</div>
                <div className="text-3xl font-bold text-primary">{stats.active_jobs}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
                <div className="text-3xl font-bold text-foreground">
                  ${stats.total_earned?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Pending Submissions</div>
                <div className="text-3xl font-bold text-warning">{stats.pending_submissions}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Completed Projects</div>
                <div className="text-3xl font-bold text-success">{stats.completed_jobs}</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Projects */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Projects</CardTitle>
                <Link href="/freelancer/projects" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.active_projects && data.active_projects.length > 0 ? (
                <div className="space-y-4">
                  {data.active_projects.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/freelancer/projects/${job.id}`}
                      className="block p-4 border border-border rounded-lg flex justify-between items-center hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="font-semibold text-foreground mb-1">{job.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.gig_type} • Due {job.deadline ? formatDistanceToNow(new Date(job.deadline), { addSuffix: true }) : 'TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'IN_PROGRESS' ? 'bg-info/20 text-info' :
                          job.status === 'ESCROW_FUNDED' ? 'bg-success/20 text-success' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-lg font-bold text-primary mt-1">
                          ${job.budget_min?.toLocaleString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📁"
                  title="No active projects"
                  description="Browse jobs and place bids to get started"
                />
              )}
            </CardContent>
          </Card>

          {/* Available Jobs */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recommended Jobs</CardTitle>
                <Link href="/freelancer/jobs" className="text-sm text-primary hover:underline">Browse all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.available_jobs && data.available_jobs.length > 0 ? (
                <div className="space-y-4">
                  {data.available_jobs.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/freelancer/jobs/${job.id}`}
                      className="block p-4 border border-border rounded-lg flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-foreground mb-1">{job.title}</div>
                        <div className="text-sm text-muted-foreground">
                          [{job.gig_type}] {job.gig_subtype?.replace(/_/g, ' ')}
                        </div>
                        {job.employer_pfi && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Employer PFI: {job.employer_pfi}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {job.deadline ? formatDistanceToNow(new Date(job.deadline), { addSuffix: true }) : 'Flexible'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🔍"
                  title="No jobs available"
                  description="Check back later for new opportunities"
                />
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/freelancer/jobs" className="block p-6 bg-card border border-border rounded-xl hover:shadow-md transition-shadow text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-semibold text-foreground">Browse Jobs</div>
              <p className="text-sm text-muted-foreground mt-1">Find your next project</p>
            </Link>
            <Link href="/freelancer/projects" className="block p-6 bg-card border border-border rounded-xl hover:shadow-md transition-shadow text-center">
              <div className="text-3xl mb-2">📁</div>
              <div className="font-semibold text-foreground">My Projects</div>
              <p className="text-sm text-muted-foreground mt-1">Manage active work</p>
            </Link>
            <Link href="/settings" className="block p-6 bg-card border border-border rounded-xl hover:shadow-md transition-shadow text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-semibold text-foreground">Settings</div>
              <p className="text-sm text-muted-foreground mt-1">Update your profile</p>
            </Link>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
