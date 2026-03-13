'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectUserRole, selectUser, selectUserPFI } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function FreelancerDashboard() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);

  useEffect(() => {
    if (!user || role !== 'freelancer') {
      router.push('/login');
    }
  }, [user, role, router]);

  if (!user || role !== 'freelancer') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Welcome back, {user.name}!
      </h1>

      {/* PFI Score Banner */}
      <div className="bg-primary text-white px-6 py-4 rounded-lg mb-8 flex items-center gap-4">
        <span className="text-4xl">🏆</span>
        <div>
          <div className="text-sm opacity-90">Your PFI Score</div>
          <div className="text-4xl font-bold">{pfi ?? '--'}</div>
        </div>
        <div className="ml-auto text-sm opacity-90">
          Higher scores = more job opportunities
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$2,850</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold text-foreground mb-1">React E-commerce Platform</div>
                <div className="text-sm text-muted-foreground">Milestone 2: Core Features</div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-warning/20 text-warning text-xs font-semibold rounded-full inline-block">
                  ⚠️ Hold
                </div>
                <div className="text-xs text-muted-foreground mt-1">Score: 72</div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold text-foreground mb-1">Mobile App UI Design</div>
                <div className="text-sm text-muted-foreground">Milestone 1: Prototype</div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-info/20 text-info text-xs font-semibold rounded-full inline-block">
                  🟡 Active
                </div>
                <div className="text-xs text-muted-foreground mt-1">Due in 3 days</div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold text-foreground mb-1">Data Entry Project</div>
                <div className="text-sm text-muted-foreground">Milestone 3: Final Review</div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-success/20 text-success text-xs font-semibold rounded-full inline-block">
                  🟢 Active
                </div>
                <div className="text-xs text-muted-foreground mt-1">Due in 5 days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Available Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <div className="font-semibold text-foreground mb-1">Backend API Development</div>
                <div className="text-sm text-muted-foreground">[Software] Integrations</div>
                <div className="text-xs text-muted-foreground mt-1">Employer PFI: 85</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">$800 - $1,200</div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <div className="font-semibold text-foreground mb-1">Blog Series (5 posts)</div>
                <div className="text-sm text-muted-foreground">[Copywriting] Blog Posts</div>
                <div className="text-xs text-muted-foreground mt-1">Employer PFI: 88</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">$500</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
