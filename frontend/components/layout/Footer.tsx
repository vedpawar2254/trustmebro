'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/freelancer') || pathname?.startsWith('/employer')) return null;

  return (
    <footer className="bg-[#100820] border-t border-[#2d1f45] px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#7c3aed] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
              </div>
              <span className="text-xl font-black text-white tracking-tighter">trustmebro</span>
            </Link>
            <p className="text-sm text-[#6b5a8a] leading-relaxed">
              The first AI-mediated gig protocol with verified deliverables and autonomous settlement.
            </p>
          </div>

          {/* Employers */}
          <div>
            <h4 className="font-bold text-[#e2d9f3] text-xs uppercase tracking-widest mb-6">Protocols</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Post Job</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Smart Filtering</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Arbitration</Link></li>
            </ul>
          </div>

          {/* Freelancers */}
          <div>
            <h4 className="font-bold text-[#e2d9f3] text-xs uppercase tracking-widest mb-6">Operations</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Browse Gigs</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">PFI Score</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Verification</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold text-[#e2d9f3] text-xs uppercase tracking-widest mb-6">Network</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Discord</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-[#6b5a8a] hover:text-[#7c3aed] transition-colors">GitHub</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#2d1f45] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} trustmebro protocol. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest hover:text-[#6b5a8a]">Privacy</Link>
            <Link href="#" className="text-[10px] text-[#4a3866] font-bold uppercase tracking-widest hover:text-[#6b5a8a]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
