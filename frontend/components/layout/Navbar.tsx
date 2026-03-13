'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, selectUserRole, selectUser, selectUserPFI } from '@/store/auth';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);

  const isEmployerView = pathname?.startsWith('/employer');
  const isFreelancerView = pathname?.startsWith('/freelancer');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  // Don't show navbar on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={role === 'employer' ? '/employer/dashboard' : role === 'freelancer' ? '/freelancer/dashboard' : '/'}
            className="text-2xl font-bold text-primary"
          >
            trustmebro
          </Link>

          {isEmployerView && (
            <div className="hidden md:flex gap-6">
              <Link
                href="/employer/dashboard"
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/employer/jobs"
                className="text-foreground hover:text-primary transition-colors"
              >
                My Jobs
              </Link>
              <Link
                href="/employer/post-job"
                className="text-foreground hover:text-primary transition-colors"
              >
                Post Job
              </Link>
            </div>
          )}

          {isFreelancerView && (
            <div className="hidden md:flex gap-6">
              <Link
                href="/freelancer/dashboard"
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/freelancer/jobs"
                className="text-foreground hover:text-primary transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/freelancer/my-projects"
                className="text-foreground hover:text-primary transition-colors"
              >
                My Projects
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {role === 'freelancer' && (
            <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
              <span>PFI: {pfi ?? '--'}</span>
              <span>🏆</span>
            </div>
          )}

          {user && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                  {user.name?.[0] || 'U'}
                </div>
                <span className="hidden md:block">{user.name}</span>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-4 py-3 border-b border-border">
                  <div className="font-semibold text-foreground">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{role}</div>
                </div>
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 hover:bg-secondary text-error text-sm transition-colors"
    >
      Logout
    </button>
  );
}
