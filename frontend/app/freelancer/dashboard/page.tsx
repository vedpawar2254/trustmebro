'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUserRole, selectUser, selectUserPFI } from '@/store/auth';

const stats = [
  {
    label: 'Active Projects',
    value: '3',
    sub: '+1 this week',
    trend: 'up',
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Total Earned',
    value: '$2,850',
    sub: '+$450 this month',
    trend: 'up',
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Pending Review',
    value: '1',
    sub: 'Awaiting feedback',
    trend: 'neutral',
    accent: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'Completed',
    value: '12',
    sub: 'All time',
    trend: 'up',
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const activeProjects = [
  {
    id: 'job_002',
    title: 'React E-commerce Platform',
    milestone: 'Milestone 2: Core Features',
    status: 'On Hold',
    statusColor: 'warn',
    progress: 55,
    budget: '$1,200',
    due: '5 days',
  },
  {
    id: 'job_004',
    title: 'Mobile App UI Design',
    milestone: 'Milestone 1: Prototype',
    status: 'Active',
    statusColor: 'success',
    progress: 30,
    budget: '$800',
    due: '3 days',
  },
  {
    id: 'job_006',
    title: 'Data Pipeline Automation',
    milestone: 'Milestone 3: Testing',
    status: 'Review',
    statusColor: 'info',
    progress: 85,
    budget: '$2,100',
    due: '1 day',
  },
];

const availableJobs = [
  {
    id: 'job_005',
    title: 'Backend API Development',
    category: 'Software · Integrations',
    pfi: 85,
    budget: '$1,500 – $2,500',
    match: 94,
    tags: ['Node.js', 'REST API'],
  },
  {
    id: 'job_003',
    title: 'Customer Database Digitization',
    category: 'Data Entry · Form Digitization',
    pfi: 85,
    budget: '$200 – $350',
    match: 78,
    tags: ['Excel', 'Data Entry'],
  },
  {
    id: 'job_007',
    title: 'AI Chatbot Integration',
    category: 'Machine Learning · NLP',
    pfi: 91,
    budget: '$3,000 – $5,000',
    match: 88,
    tags: ['Python', 'OpenAI'],
  },
];

const recentActivity = [
  { emoji: '💬', text: 'Client commented on React E-commerce Platform', time: '2 hours ago' },
  { emoji: '✅', text: 'Milestone 1 approved on Mobile App UI Design', time: '5 hours ago' },
  { emoji: '💸', text: 'Payment of $450 released for Data Pipeline', time: '1 day ago' },
  { emoji: '📋', text: 'New job posted matching your skills: AI Integration', time: '2 days ago' },
];

export default function FreelancerDashboard() {
  const router = useRouter();
  const user   = useAuthStore(selectUser);
  const role   = useAuthStore(selectUserRole);
  const pfi    = useAuthStore(selectUserPFI);

  useEffect(() => {
    if (!user || role !== 'freelancer') router.push('/login');
  }, [user, role, router]);

  if (!user || role !== 'freelancer') return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dash-page">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">{greeting} 👋</p>
          <h1 className="dash-title">{user.name}</h1>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-pfi-badge">
            <span className="dash-pfi-label">PFI Score</span>
            <span className="dash-pfi-value">{pfi ?? '--'}</span>
            <span className="dash-pfi-sub">Trusted Freelancer</span>
          </div>
          <div className="dash-notif-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="dash-notif-dot" />
          </div>
        </div>
      </header>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="dash-stats">
        {stats.map((s) => (
          <div key={s.label} className={`dash-stat-card${s.accent ? ' accent' : ''}`}>
            <div className="dash-stat-top">
              <span className="dash-stat-icon">{s.icon}</span>
              <span className={`dash-stat-trend ${s.trend}`}>
                {s.trend === 'up' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                )}
              </span>
            </div>
            <span className="dash-stat-value">{s.value}</span>
            <span className="dash-stat-label">{s.label}</span>
            <span className="dash-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Two-column section ────────────────────────────────── */}
      <div className="dash-grid">

        {/* Active Projects */}
        <section className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <span className="dash-card-title">Active Projects</span>
              <span className="dash-card-count">{activeProjects.length}</span>
            </div>
            <Link href="/freelancer/projects" className="dash-link">View all →</Link>
          </div>
          <div className="dash-list">
            {activeProjects.map((p) => (
              <Link key={p.id} href={`/freelancer/projects/${p.id}`} className="dash-row">
                <div className="dash-row-main">
                  <div className="dash-row-top">
                    <span className="dash-row-title">{p.title}</span>
                    <span className={`dash-badge ${p.statusColor}`}>{p.status}</span>
                  </div>
                  <span className="dash-row-sub">{p.milestone}</span>
                  <div className="dash-progress-bar-wrap">
                    <div className="dash-progress-bar">
                      <div
                        className={`dash-progress-fill ${p.statusColor}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="dash-progress-label">{p.progress}%</span>
                  </div>
                </div>
                <div className="dash-row-right">
                  <span className="dash-budget">{p.budget}</span>
                  <span className="dash-row-meta">Due in {p.due}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recommended Jobs */}
        <section className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <span className="dash-card-title">Recommended Jobs</span>
              <span className="dash-card-count">{availableJobs.length}</span>
            </div>
            <Link href="/freelancer/jobs" className="dash-link">Browse all →</Link>
          </div>
          <div className="dash-list">
            {availableJobs.map((j) => (
              <Link key={j.id} href={`/freelancer/jobs/${j.id}`} className="dash-row">
                <div className="dash-row-main">
                  <div className="dash-row-top">
                    <span className="dash-row-title">{j.title}</span>
                    <span className="dash-match-badge">{j.match}% match</span>
                  </div>
                  <span className="dash-row-sub">{j.category}</span>
                  <div className="dash-tag-row">
                    {j.tags.map((tag) => (
                      <span key={tag} className="dash-tag">{tag}</span>
                    ))}
                    <span className="dash-row-meta">Employer PFI: {j.pfi}</span>
                  </div>
                </div>
                <div className="dash-row-right">
                  <span className="dash-budget">{j.budget}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>

      {/* ── Bottom row ────────────────────────────────────────── */}
      <div className="dash-bottom-row">

        {/* Recent Activity */}
        <section className="dash-card dash-activity-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent Activity</span>
          </div>
          <div className="dash-activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="dash-activity-item">
                <div className="dash-activity-icon">{a.emoji}</div>
                <div className="dash-activity-body">
                  <p className="dash-activity-text">{a.text}</p>
                  <p className="dash-activity-time">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dash-card dash-quick-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Quick Actions</span>
          </div>
          <div className="dash-quick-grid">
            <Link href="/freelancer/jobs" className="dash-quick-action">
              <span className="dash-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <span>Browse Jobs</span>
            </Link>
            <Link href="/freelancer/projects" className="dash-quick-action">
              <span className="dash-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span>My Projects</span>
            </Link>
            <Link href="/projects/job_002/chat" className="dash-quick-action">
              <span className="dash-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span>Open Chat</span>
            </Link>
            <Link href="/freelancer/earnings" className="dash-quick-action">
              <span className="dash-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span>Earnings</span>
            </Link>
          </div>
        </section>

      </div>

    </div>
  );
}
