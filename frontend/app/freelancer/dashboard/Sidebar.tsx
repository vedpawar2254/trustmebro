'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, selectUserRole, selectUserPFI } from '@/store/auth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const employerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: '📊' },
  { label: 'My Jobs', href: '/employer/jobs', icon: '📋' },
  { label: 'Post Job', href: '/employer/post-job', icon: '✨' },
  { label: 'Payments', href: '/payments', icon: '💳' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

const freelancerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/freelancer/dashboard', icon: '📊' },
  { label: 'Browse Jobs', href: '/freelancer/jobs', icon: '🔍' },
  { label: 'My Projects', href: '/freelancer/projects', icon: '📁' },
  { label: 'Earnings', href: '/payments', icon: '💰' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const userName = useAuthStore((state) => state.user?.name);
  const userEmail = useAuthStore((state) => state.user?.email);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);
  const logout = useAuthStore((state) => state.logout);

  const isEmployer = role === 'employer';
  const navItems = isEmployer ? employerNavItems : freelancerNavItems;
  const basePath = isEmployer ? '/employer' : '/freelancer';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-full bg-surface text-white p-6 z-20 transition-transform duration-300 md:translate-x-0 -translate-x-full">
      {/* Top Header */}
      <div className="mb-8">
        <Link href={`${basePath}/dashboard`}>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">trustmebro</h2>
        </Link>
        <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
          {isEmployer ? 'Employer Portal' : 'Freelancer Portal'}
        </p>
      </div>

      {/* PFI Score for Freelancers */}
      {!isEmployer && pfi !== undefined && (
        <div className="mb-6 p-4 bg-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-xs text-white/70 uppercase tracking-wide">PFI Score</div>
              <div className="text-2xl font-bold text-white">{pfi}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `${basePath}/dashboard` && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
            <p className="text-xs text-white/50 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>

        <div className="mt-4 text-[10px] text-white/40 text-center uppercase tracking-wider">
          AI-Powered Freelance Marketplace
        </div>
      </div>
    </aside>
  );
}
