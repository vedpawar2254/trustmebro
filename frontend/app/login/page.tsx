'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/api/services';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      const user = {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as 'employer' | 'freelancer',
        pfi_score: response.user.pfi_score,
      };

      login(user, response.token);

      // Redirect based on role
      const redirectUrl = response.user.role === 'employer'
        ? '/employer/dashboard'
        : '/freelancer/dashboard';
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[rgb(96,90,113)]">

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl h-[720px] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-8 text-white bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://img.sanishtech.com/u/e14a8ea2bb465e61d1e237fef9a98292.png')",
          }}
        >
          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* TOP BAR */}
          <div className="relative z-10 flex justify-between items-center">
            <h2 className="text-lg font-semibold">trustmebro</h2>

            <Link
              href="/"
              className="text-sm px-4 py-2 border border-white/40 rounded-full hover:bg-white hover:text-black transition"
            >
              Back to website →
            </Link>
          </div>

          {/* BOTTOM TEXT */}
          <div className="relative z-10">
            <p className="text-2xl font-semibold mb-2">
              Hire AI freelancers smarter
            </p>

            <p className="text-sm text-white/80">
              AI-generated specs. Automatic matching. Trusted execution.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-center px-12 py-12 bg-[rgb(44,38,56)]">

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 text-white">
              Login to your account
            </h1>

            <p className="text-gray-400 text-sm">
              Don’t have an account?{' '}
              <Link href="/register" className="font-medium underline">
                Sign up
              </Link>
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-md text-red-300 text-sm">
                {error}
              </div>
            )}

            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-md px-4 bg-[rgb(60,54,76)] border border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-md px-4 bg-[rgb(60,54,76)] border border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full py-3 text-base bg-[rgb(109,84,181)] rounded-md" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-8 max-w-md text-sm text-gray-400">
            <div className="flex-1 h-px bg-white/20"></div>
            Or continue with
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* SOCIAL LOGIN */}
          <div className="grid grid-cols-2 gap-4 max-w-md">

            <Button variant="secondary" className="w-full border-white/20 text-white border">
              Google
            </Button>

            <Button variant="secondary" className="w-full border-white/20 text-white border">
              Apple
            </Button>

          </div>

        </div>
      </div>
    </div>
  );
}