'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUser } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '../../dashboard/DashboardLayout';
import { jobService, type Job, type JobSpec, type Milestone } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

const GIG_BADGE_VARIANT: Record<string, 'software' | 'copywriting' | 'data_entry' | 'translation'> = {
  SOFTWARE: 'software',
  COPYWRITING: 'copywriting',
  DATA_ENTRY: 'data_entry',
  TRANSLATION: 'translation',
};

export default function FreelancerJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const user = useAuthStore(selectUser);

  const [job, setJob] = useState<Job | null>(null);
  const [spec, setSpec] = useState<JobSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bid form state
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidDays, setBidDays] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        const [jobRes, specRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          jobService.getSpec(Number(jobId)).catch(() => null),
        ]);

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data);
        }
        if (specRes?.success && specRes.data) {
          setSpec(specRes.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch job:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [user, router, jobId]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!bidAmount || !bidMessage || !bidDays) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await jobService.placeBid(Number(jobId), {
        amount: Number(bidAmount),
        message: bidMessage,
        estimated_days: Number(bidDays),
      });

      if (response.success) {
        setSuccess('Bid submitted successfully! The employer will review your proposal.');
        setBidAmount('');
        setBidMessage('');
        setBidDays('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="🔍"
            title="Job not found"
            description="This job may have been removed or is no longer available."
          />
        </div>
      </DashboardLayout>
    );
  }

  const milestones = spec?.milestones_json || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-background">
        <Link
          href="/freelancer/jobs"
          className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block"
        >
          &larr; Back to Jobs
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant={GIG_BADGE_VARIANT[job.gig_type] || 'default'}>
            {job.gig_type}
          </Badge>
          {job.gig_subtype && (
            <Badge variant="muted">{job.gig_subtype.replace(/_/g, ' ')}</Badge>
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            job.status === 'PUBLISHED' ? 'bg-success/20 text-success' :
            'bg-muted text-muted-foreground'
          }`}>
            {job.status}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {job.employer_name && <span>by {job.employer_name}</span>}
          {job.employer_pfi && <span>PFI {job.employer_pfi}</span>}
          <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {/* Milestones */}
              {milestones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {milestones.map((milestone: Milestone, index: number) => (
                        <div
                          key={milestone.id || index}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-foreground">
                              {milestone.title}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground ml-11">
                            {milestone.description}
                          </p>
                          {milestone.deliverables && milestone.deliverables.length > 0 && (
                            <div className="mt-3 ml-11">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                                Deliverables
                              </div>
                              <ul className="text-sm text-foreground space-y-1">
                                {milestone.deliverables.map((d, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {spec?.requirements_json && Object.keys(spec.requirements_json).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(spec.requirements_json).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3">
                          <span className="text-primary font-medium min-w-[120px] capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-foreground">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget & Deadline */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Budget
                      </div>
                      <div className="text-2xl font-bold text-primary mt-1">
                        ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Deadline
                      </div>
                      <div className="font-medium text-foreground mt-1">
                        {job.deadline
                          ? new Date(job.deadline).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Flexible'}
                      </div>
                      {job.deadline && (
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Milestones
                      </div>
                      <div className="font-medium text-foreground mt-1">
                        {milestones.length || 'TBD'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  {success ? (
                    <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm">
                      {success}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitBid} className="space-y-4">
                      {error && (
                        <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                          {error}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Your Bid Amount ($)
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={job.budget_min}
                          max={job.budget_max}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Budget range: ${job.budget_min} - ${job.budget_max}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Estimated Days
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 14"
                          value={bidDays}
                          onChange={(e) => setBidDays(e.target.value)}
                          min={1}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Cover Letter
                        </label>
                        <Textarea
                          placeholder="Explain why you're the best fit for this project..."
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          rows={5}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Employer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Employer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {job.employer_name?.[0] || 'E'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {job.employer_name || 'Employer'}
                      </div>
                      {job.employer_pfi && (
                        <div className="text-sm text-muted-foreground">
                          PFI Score: {job.employer_pfi}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
