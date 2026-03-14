'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUser } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { jobService, type Job } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

const GIG_TYPES = ['SOFTWARE', 'COPYWRITING', 'DATA_ENTRY', 'TRANSLATION'];
const GIG_BADGE_VARIANT: Record<string, 'software' | 'copywriting' | 'data_entry' | 'translation'> = {
  SOFTWARE: 'software',
  COPYWRITING: 'copywriting',
  DATA_ENTRY: 'data_entry',
  TRANSLATION: 'translation',
};

interface Filters {
  keyword: string;
  gig_type: string;
  min_budget: string;
  max_budget: string;
}

export default function BrowseJobsPage() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    gig_type: '',
    min_budget: '',
    max_budget: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobService.getPublished({
          gig_type: filters.gig_type || undefined,
          min_budget: filters.min_budget ? Number(filters.min_budget) : undefined,
          max_budget: filters.max_budget ? Number(filters.max_budget) : undefined,
          keyword: filters.keyword || undefined,
        });
        if (response.success && response.data) {
          setJobs(response.data.jobs);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, router, filters.gig_type, filters.min_budget, filters.max_budget]);

  // Client-side keyword filter for instant feedback
  const filteredJobs = useMemo(() => {
    if (!filters.keyword) return jobs;
    const kw = filters.keyword.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        j.description?.toLowerCase().includes(kw)
    );
  }, [jobs, filters.keyword]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ keyword: '', gig_type: '', min_budget: '', max_budget: '' });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-background">
        <h1 className="text-3xl font-bold text-foreground">Browse Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Find your next project - all specs are AI-structured and verifiable
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-8">
          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search
                  </label>
                  <Input
                    placeholder="Search jobs..."
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={filters.gig_type}
                    onChange={(e) => handleFilterChange('gig_type', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary"
                  >
                    <option value="">All Categories</option>
                    {GIG_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Min Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={filters.min_budget}
                    onChange={(e) => handleFilterChange('min_budget', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="$10,000"
                    value={filters.max_budget}
                    onChange={(e) => handleFilterChange('max_budget', e.target.value)}
                  />
                </div>
              </div>

              {(filters.keyword || filters.gig_type || filters.min_budget || filters.max_budget) && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.gig_type && (
                    <Badge variant="default">{filters.gig_type}</Badge>
                  )}
                  {filters.min_budget && (
                    <Badge variant="muted">Min: ${filters.min_budget}</Badge>
                  )}
                  {filters.max_budget && (
                    <Badge variant="muted">Max: ${filters.max_budget}</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No jobs match your filters"
              description="Try adjusting your search or clearing filters to see more results."
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/freelancer/jobs/${job.id}`}
                    className="block"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={GIG_BADGE_VARIANT[job.gig_type] || 'default'}>
                              {job.gig_type}
                            </Badge>
                            {job.gig_subtype && (
                              <Badge variant="muted">
                                {job.gig_subtype.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.status === 'PUBLISHED' ? 'bg-success/20 text-success' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {job.status}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {job.description}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <div className="text-lg font-bold text-primary">
                              ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                            </div>
                            {job.employer_name && (
                              <div className="text-xs text-muted-foreground mt-1">
                                by {job.employer_name}
                                {job.employer_pfi && ` • PFI ${job.employer_pfi}`}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {job.deadline
                                ? `Due ${formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}`
                                : 'Flexible deadline'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
