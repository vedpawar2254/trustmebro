'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Logic: If email is empty or "test", we go to freelancer (since this is what user wants)
      // Otherwise, we allow role-based detection if string contains "employer"
      const role = email.toLowerCase().includes('employer') ? 'employer' as const : 'freelancer' as const;
      
      const mockUser = {
        id: 'user_123',
        name: role === 'freelancer' ? 'Alex Freelancer' : 'Julia Employer',
        email: email || 'test@trustmebro.io',
        role: role,
      };
      
      const mockToken = 'mock_jwt_token';
      login(mockUser, mockToken);

      // Redirect based on detected role
      const redirectUrl = role === 'employer'
        ? '/employer/dashboard'
        : '/freelancer/dashboard';
      
      router.push(redirectUrl);
    } catch (err: any) {
      setError('Authorization failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#100820] px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7c3aed] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#5b21b6] blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center shadow-[0_0_20px_#7c3aed66] transition-transform group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">trustmebro</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#e2d9f3]">Access the Protocol</h1>
          <p className="text-[#6b5a8a] text-sm mt-1">Authenticate to manage your verifiable gigs</p>
        </div>

        <div className="bg-[#130d22] border border-[#2d1f45] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">
                Identity Credentials
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Hub ID"
                className="w-full bg-[#1d1233] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c]"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em]">
                  Security Key
                </label>
                <Link href="#" className="text-[10px] text-[#7c3aed] hover:underline font-bold uppercase tracking-widest">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1d1233] border border-[#2d1f45] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c]"
                required
              />
            </div>

            {error && (
              <div className="bg-[#dc262615] text-[#ef4444] p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center border border-[#dc262622]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#7c3aed] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#8b5cf6] hover:shadow-[0_0_20px_#7c3aed44] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Decrypting...' : 'Authorize Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2d1f45] text-center text-xs text-[#6b5a8a]">
            New to the platform?{' '}
            <Link href="/register" className="text-[#a78bfa] font-bold hover:underline">
              Initialize Account
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
           <button 
             onClick={() => { setEmail('freelancer@test.com'); setPassword('password'); }}
             className="text-[9px] font-bold text-[#4a3866] uppercase tracking-widest border border-[#2d1f45] py-2 rounded-lg hover:bg-[#1d1233] transition-all"
           >
             Quick Freelancer
           </button>
           <button 
             onClick={() => { setEmail('employer@test.com'); setPassword('password'); }}
             className="text-[9px] font-bold text-[#4a3866] uppercase tracking-widest border border-[#2d1f45] py-2 rounded-lg hover:bg-[#1d1233] transition-all"
           >
             Quick Employer
           </button>
        </div>
        
        <p className="mt-6 text-center text-[10px] text-[#4a3866] uppercase tracking-widest font-bold">
           Encrypted Session • Verified by trustmebro
        </p>
      </div>
    </div>
  );
}
