'use client';

import { useAuthStore, selectUser } from '@/store/auth';
import Link from 'next/link';

export default function EmployerDashboard() {
  const user = useAuthStore(selectUser);

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">Welcome back, {user?.name}</p>
          <h1 className="dash-title">Employer Console</h1>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-pfi-badge">
            <span className="dash-pfi-label">Reputation Layer</span>
            <span className="dash-pfi-value">92.4</span>
            <span className="dash-pfi-sub">Elite Tier</span>
          </div>
          <Link href="/employer/post-job" className="px-6 py-3 bg-[#7c3aed] text-white rounded-xl font-bold text-sm hover:bg-[#8b5cf6] hover:shadow-[0_0_15px_#7c3aed44] transition-all">
            + Initiate Project
          </Link>
        </div>
      </header>

      {/* Role Switcher Warning for Demo */}
      <div className="bg-[#f59e0b10] border border-[#f59e0b33] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="text-xs font-bold text-[#fbbf24] uppercase tracking-widest">Wrong Console?</div>
            <p className="text-[11px] text-[#7b6a96]">Identified as <span className="text-[#e2d9f3] font-bold">Employer</span>. To view the Freelancer dashboard, please re-authenticate.</p>
          </div>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#1d1233] border border-[#2d1f45] text-[#fbbf24] rounded-lg text-xs font-bold hover:bg-[#251840] transition-all">
           Switch to Freelancer
        </Link>
      </div>

      {/* Stats row */}
      <div className="dash-stats">
        <StatCard label="Active Protocols" value="03" trend="+1" />
        <StatCard label="Allocated Capital" value="$12.4k" trend="neutral" accent />
        <StatCard label="Incoming Proposals" value="18" trend="+5" />
        <StatCard label="Completion Rate" value="98%" trend="+0.2%" />
      </div>

      <div className="dash-grid">
        {/* Main section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[#e2d9f3] font-bold flex items-center gap-2">
              Recent Verifications
              <span className="dash-card-count">3</span>
            </h2>
            <Link href="/employer/jobs" className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest hover:underline">
              View All Pipeline
            </Link>
          </div>

          <div className="space-y-3">
            <ActivityItem 
              title="Milestone 2 Verified" 
              subtitle="React E-commerce Platform" 
              time="2h ago" 
              status="SUCCESS"
              href="/projects/job_001/verification/sub_pass"
            />
            <ActivityItem 
              title="Proposal Received" 
              subtitle="Mobile App Development" 
              time="5h ago" 
              status="WARN"
              href="/employer/jobs/job_001"
            />
            <ActivityItem 
              title="Escrow Funded" 
              subtitle="Copywriting Package" 
              time="1d ago" 
              status="INFO" 
            />
          </div>
        </div>

        {/* Sidebar section */}
        <div className="space-y-6">
           <h2 className="text-[#e2d9f3] font-bold">Quick Actions</h2>
           <div className="grid grid-cols-1 gap-3">
              <QuickLink icon="📝" title="Post New Job" href="/employer/post-job" />
              <QuickLink icon="💬" title="Open Signal" href="/projects/job_002/chat" />
              <QuickLink icon="⚖️" title="Review Disputes" href="#" />
           </div>
           
           <div className="dash-card bg-gradient-to-br from-[#1d1233] to-[#130d22] border-[#7c3aed22] p-6">
              <div className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-[0.2em] mb-3">AI Guard Status</div>
              <p className="text-xs text-[#6b5a8a] leading-relaxed mb-4">
                Your account is currently protected by AI-mediated arbitration. All project specifications are being monitored for clarity.
              </p>
              <div className="h-1.5 w-full bg-[#100820] rounded-full overflow-hidden">
                <div className="h-full bg-[#7c3aed] w-3/4 shadow-[0_0_10px_#7c3aed]"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, accent }: { label: string; value: string; trend: string; accent?: boolean }) {
  return (
    <div className={`dash-stat-card ${accent ? 'accent' : ''}`}>
      <div className="dash-stat-top">
        <span className="dash-stat-label">{label}</span>
        <div className={`dash-stat-trend ${trend === 'neutral' ? 'neutral' : 'up'}`}>
          {trend === 'neutral' ? '•' : trend}
        </div>
      </div>
      <div className="dash-stat-value">{value}</div>
    </div>
  );
}

function ActivityItem({ title, subtitle, time, status, href }: { title: string; subtitle: string; time: string; status: string; href?: string }) {
  const content = (
    <div className="dash-card flex items-center justify-between p-4 group transition-all hover:border-[#7c3aed44]">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${status === 'SUCCESS' ? 'bg-[#4ade80]' : status === 'WARN' ? 'bg-[#fbbf24]' : 'bg-[#3b82f6]'}`} />
        <div>
          <div className="text-sm font-bold text-[#e2d9f3] group-hover:text-[#c4b5fd] transition-colors">{title}</div>
          <div className="text-[11px] text-[#6b5a8a]">{subtitle} • {time}</div>
        </div>
      </div>
      <div className="text-[#4a3866] group-hover:text-[#7c3aed] transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function QuickLink({ icon, title, href }: { icon: string; title: string, href: string }) {
  return (
    <Link href={href} className="dash-card flex items-center gap-3 p-4 hover:bg-[#1d1233] hover:border-[#7c3aed33] transition-all group">
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-bold text-[#7b6a96] group-hover:text-[#e2d9f3]">{title}</span>
    </Link>
  );
}
