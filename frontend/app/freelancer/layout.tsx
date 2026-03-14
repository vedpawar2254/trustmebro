'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, selectUser, selectUserPFI } from '@/store/auth';

const navItems = [
  {
    href: '/freelancer/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/freelancer/jobs',
    label: 'Browse Jobs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/freelancer/projects',
    label: 'My Projects',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/freelancer/messages',
    label: 'Messages',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/freelancer/earnings',
    label: 'Earnings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const pfi = useAuthStore(selectUserPFI);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FR';

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        {/* Logo */}
        <div className="dash-logo">
          <div className="dash-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#7c3aed">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="dash-logo-text">trustmebro</span>
        </div>

        {/* Nav label */}
        <p className="dash-nav-section-label">WORKSPACE</p>

        {/* Navigation */}
        <nav className="dash-nav">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`dash-nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
            >
              <span className="dash-nav-icon">{icon}</span>
              <span>{label}</span>
              {pathname === href && <span className="dash-nav-active-dot" />}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div className="dash-sidebar-divider" />

        {/* User profile */}
        <div className="dash-user-card">
          <div className="dash-user-avatar">{initials}</div>
          <div className="dash-user-info">
            <p className="dash-user-name">{user?.name ?? 'Freelancer'}</p>
            <p className="dash-user-role">PFI Score: <span className="dash-user-pfi">{pfi ?? '--'}</span></p>
          </div>
        </div>

        {/* Sign out */}
        <Link href="/login" className="dash-nav-item dash-signout">
          <span className="dash-nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>Sign out</span>
        </Link>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
