'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function Sidebar() {
  const pathname = usePathname();
  const userName = useAuthStore((state) => state.user?.name);

  const navItems = [
    { label: 'Dashboard', href: '/employer/dashboard', icon: '📊' },
    { label: 'My Jobs', href: '/employer/jobs', icon: '📋' },
    { label: 'Post Job', href: '/employer/post-job', icon: '✨' },
    { label: 'Projects', href: '/employer/projects', icon: '📁' },
    { label: 'Chat', href: '/projects/chat', icon: '💬' },
  ];

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-[rgb(44,38,56)] text-white p-6 flex flex-col z-20 transition-transform duration-300 md:translate-x-0 -translate-x-full">
      {/* Top Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">trustmebro</h2>
        <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Employer Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/employer/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-white/10 text-white font-medium' 
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
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
            <p className="text-xs text-white/50 truncate">Employer</p>
          </div>
        </div>
        <div className="text-[10px] text-white/40 text-center uppercase tracking-wider">
          trustmebro AI Marketplace
        </div>
      </div>
    </aside>
  );
}
