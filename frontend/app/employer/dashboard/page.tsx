'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUserRole, selectUser } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployerDashboard() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);

  useEffect(() => {
    if (!user || role !== 'employer') {
      router.push('/login');
    }
  }, [user, role, router]);

  if (!user || role !== 'employer') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.name}!
        </h1>
        <Link href="/employer/post-job">
          <Button variant="primary">+ Post New Job</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$4,250</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">7</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">3</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-1">Bob submitted Milestone 2</div>
              <div className="text-sm text-muted-foreground mb-2">React E-commerce Platform</div>
              <div className="text-xs text-muted-foreground">2 hours ago</div>
              <div className="mt-2">
                <Link href="/projects/job_001/verification/sub_hold" className="text-primary text-sm font-semibold hover:underline">
                  View Verification Report
                </Link>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-1">New bid from Sarah</div>
              <div className="text-sm text-muted-foreground mb-2">Mobile App Development</div>
              <div className="text-xs text-muted-foreground">5 hours ago</div>
              <div className="mt-2">
                <Link href="/employer/jobs/job_001" className="text-primary text-sm font-semibold hover:underline">
                  View Bid
                </Link>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-1">Project completed</div>
              <div className="text-sm text-muted-foreground mb-2">Copywriting Package</div>
              <div className="text-xs text-muted-foreground">1 day ago</div>
              <div className="mt-2">
                <Link href="/projects/job_002/verification/sub_pass" className="text-primary text-sm font-semibold hover:underline">
                  View Report
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/employer/jobs" className="block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
          <div className="text-2xl mb-1">📋</div>
          <div className="font-semibold text-foreground text-sm">My Jobs</div>
        </Link>
        <Link href="/employer/post-job" className="block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
          <div className="text-2xl mb-1">✨</div>
          <div className="font-semibold text-foreground text-sm">Post a Job</div>
        </Link>
        <Link href="/projects/job_002/chat" className="block p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
          <div className="text-2xl mb-1">💬</div>
          <div className="font-semibold text-foreground text-sm">Open Chat</div>
        </Link>
      </div>
    </div>
  );
}
