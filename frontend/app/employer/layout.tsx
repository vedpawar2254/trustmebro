'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUser, selectUserPFI, selectUserRole } from '@/store/auth';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const pfi = useAuthStore(selectUserPFI);
  const role = useAuthStore(selectUserRole);
  const logout = useAuthStore((state) => state.logout);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!user || role !== 'employer') {
      router.push('/login');
    }
  }, [user, role, router]);

  if (!user || role !== 'employer') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/employer/dashboard', icon: '📊' },
    { label: 'My Jobs', href: '/employer/jobs', icon: '📋' },
    { label: 'Post Job', href: '/employer/post-job', icon: '✨' },
    { label: 'Payments', href: '/employer/payments', icon: '💸' },
    { label: 'Messages', href: '/employer/messages', icon: '💬' },
  ];

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className={`dash-sidebar transition-all duration-300 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[240px]'}`}>
        <div className="dash-logo">
          <div className="dash-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          {!isSidebarCollapsed && <span className="dash-logo-text">trustmebro</span>}
        </div>

        <div className="dash-nav-section-label">{!isSidebarCollapsed ? 'EMPLOYER CONSOLE' : '...' }</div>
        
        <nav className="dash-nav flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="dash-nav-icon text-lg">{item.icon}</span>
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {isActive && !isSidebarCollapsed && <div className="dash-nav-active-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-divider" />

        <div className="dash-user-card">
          <div className="dash-user-avatar">
             {user.name?.[0] || 'E'}
          </div>
          {!isSidebarCollapsed && (
            <div className="dash-user-info">
              <span className="dash-user-name">{user.name}</span>
              <span className="dash-user-role">Employer • <span className="dash-user-pfi">PFI {pfi ?? 95}</span></span>
            </div>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="dash-nav-item dash-signout mt-2"
        >
          <span className="dash-nav-icon">🚪</span>
          {!isSidebarCollapsed && <span>Authorize Signout</span>}
        </button>
        
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="mt-6 text-[10px] font-bold text-[#4a3866] uppercase tracking-widest hover:text-[#7b6a96] transition-colors"
        >
          {isSidebarCollapsed ? '→ Expand' : '← Collapse'}
        </button>
      </aside>

      {/* Main Content */}
      <main className="dash-main relative">
         <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-20">
            <div className="text-[120px] font-black leading-none text-[#7c3aed] select-none">H</div>
         </div>
         {children}
      </main>
    </div>
  );
}
