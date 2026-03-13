'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectUserRole, selectUser } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Welcome back, {user.name}!
      </h1>

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
                <button className="text-primary text-sm font-semibold hover:underline">
                  View Verification Report
                </button>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-1">New bid from Sarah</div>
              <div className="text-sm text-muted-foreground mb-2">Mobile App Development</div>
              <div className="text-xs text-muted-foreground">5 hours ago</div>
              <div className="mt-2">
                <button className="text-primary text-sm font-semibold hover:underline">
                  View Bid
                </button>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="font-semibold text-foreground mb-1">Project completed</div>
              <div className="text-sm text-muted-foreground mb-2">Copywriting Package</div>
              <div className="text-xs text-muted-foreground">1 day ago</div>
              <div className="mt-2">
                <button className="text-primary text-sm font-semibold hover:underline">
                  View Report
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
