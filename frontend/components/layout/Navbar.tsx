'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, selectUserRole, selectUser, selectUserPFI } from '@/store/auth';

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const isDashboard = pathname?.startsWith('/freelancer') || pathname?.startsWith('/employer');

  // Don't show navbar on auth pages or dashboard (has its own sidebar)
  if (isAuthPage || isDashboard) {
    return null;
  }

  return (
    <nav className="bg-[#100820] border-b border-[#2d1f45] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center shadow-[0_0_15px_#7c3aed44] transition-transform group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-black text-white tracking-tighter">trustmebro</span>
          </Link>

          <div className="hidden md:flex gap-8">
            <NavLink href="/how-it-works" active={pathname === '/how-it-works'}>How it Works</NavLink>
            <NavLink href="/pricing" active={pathname === '/pricing'}>Pricing</NavLink>
            <NavLink href="/explore" active={pathname === '/explore'}>Explore</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <Link href="/login" className="text-sm font-bold text-[#7b6a96] hover:text-[#e2d9f3] transition-colors">
                Log in
              </Link>
              <Link href="/register" className="px-5 py-2.5 bg-[#7c3aed] text-white rounded-xl font-bold text-sm hover:bg-[#8b5cf6] hover:shadow-[0_0_15px_#7c3aed44] transition-all">
                Sign up
              </Link>
            </>
          ) : (
             <div className="flex items-center gap-4">
               {role === 'freelancer' && (
                 <div className="flex items-center gap-2 bg-[#1d1233] border border-[#2d1f45] px-3 py-1.5 rounded-full text-xs font-bold text-[#a78bfa]">
                    <span className="opacity-60 uppercase tracking-tighter">PFI Score</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                    {pfi ?? '--'}
                 </div>
               )}
               <Link 
                 href={role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard'}
                 className="px-5 py-2.5 bg-[#1d1233] text-[#e2d9f3] border border-[#2d1f45] rounded-xl font-bold text-sm hover:bg-[#251840] hover:border-[#7c3aed44] transition-all"
               >
                 Go to Console
               </Link>
             </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm font-bold uppercase tracking-widest transition-all ${
        active ? 'text-[#7c3aed]' : 'text-[#4a3866] hover:text-[#7b6a96]'
      }`}
    >
      {children}
    </Link>
  );
}
