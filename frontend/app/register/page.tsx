'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'freelancer' as 'employer' | 'freelancer', // Defaulting to freelancer for better demo flow
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Mock successful registration for now
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      const mockToken = 'mock_jwt_token';

      login(mockUser, mockToken);

      const redirectUrl = mockUser.role === 'employer'
        ? '/employer/dashboard'
        : '/freelancer/dashboard';
      router.push(redirectUrl);
    } catch (err: unknown) {
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#100820] px-4 relative overflow-hidden py-20">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7c3aed] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#5b21b6] blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center shadow-[0_0_20px_#7c3aed66] transition-transform group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">trustmebro</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#e2d9f3]">Join the Protocol</h1>
          <p className="text-[#6b5a8a] text-sm mt-1">Start your journey with AI-mediated trust</p>
        </div>

        <div className="bg-[#130d22] border border-[#2d1f45] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">
                Select Your Role
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'employer'
                      ? 'border-[#7c3aed] bg-[#7c3aed10]'
                      : 'border-[#2d1f45] bg-[#1d1233] hover:border-[#3d2a5c]'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'employer' })}
                >
                  <span className="text-2xl">🏢</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.role === 'employer' ? 'text-[#a78bfa]' : 'text-[#6b5a8a]'}`}>Employer</span>
                </button>
                <button
                  type="button"
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'freelancer'
                      ? 'border-[#7c3aed] bg-[#7c3aed10]'
                      : 'border-[#2d1f45] bg-[#1d1233] hover:border-[#3d2a5c]'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                >
                  <span className="text-2xl">👤</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.role === 'freelancer' ? 'text-[#a78bfa]' : 'text-[#6b5a8a]'}`}>Freelancer</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digital Alias"
                className={`w-full bg-[#1d1233] border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c] ${errors.name ? 'border-[#dc2626]' : 'border-[#2d1f45]'}`}
              />
              {errors.name && <p className="text-[10px] text-[#ef4444] font-bold ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className={`w-full bg-[#1d1233] border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c] ${errors.email ? 'border-[#dc2626]' : 'border-[#2d1f45]'}`}
              />
              {errors.email && <p className="text-[10px] text-[#ef4444] font-bold ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#4a3866] uppercase tracking-[0.2em] ml-1">
                Security Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={`w-full bg-[#1d1233] border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#7c3aed44] transition-all placeholder:text-[#3d2a5c] ${errors.password ? 'border-[#dc2626]' : 'border-[#2d1f45]'}`}
              />
              {errors.password && <p className="text-[10px] text-[#ef4444] font-bold ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#7c3aed] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#8b5cf6] hover:shadow-[0_0_20px_#7c3aed44] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Initialize Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2d1f45] text-center text-xs text-[#6b5a8a]">
            Already participating?{' '}
            <Link href="/login" className="text-[#a78bfa] font-bold hover:underline">
              Access Vault
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-[#4a3866] uppercase tracking-widest font-bold">
           Secure Handshake • trustmebro v2.0
        </p>
      </div>
    </div>
  );
}
