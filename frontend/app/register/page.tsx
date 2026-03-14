'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employer' as 'employer' | 'freelancer',
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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password =
        'Password must be at least 8 characters with 1 letter and 1 number';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    try {
      const mockUser = {
        id: 'user_123',
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      login(mockUser, 'mock_jwt_token');

      const redirectUrl =
        formData.role === 'employer'
          ? '/employer/dashboard'
          : '/freelancer/dashboard';

      router.push(redirectUrl);
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
              "url('https://img.sanishtech.com/u/7133f94f667522e3726d97748f20128f.png')",
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Top */}
          <div className="relative z-10 flex justify-between items-center">
            <h2 className="text-lg font-semibold">trustmebro</h2>

            <Link
              href="/"
              className="text-sm px-4 py-2 border border-white/40 rounded-full hover:bg-white hover:text-black transition"
            >
              Back to website →
            </Link>
          </div>

          {/* Bottom Text */}
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create your account
            </h1>

            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">

            {/* ROLE SELECT */}
            <div className="grid grid-cols-2 gap-4">

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: 'employer' })
                }
                className={`p-4 rounded-lg border text-left transition
                ${
                  formData.role === 'employer'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20'
                }`}
              >
                <div className="text-lg font-semibold text-white mb-1">
                  Employer
                </div>
                <div className="text-xs text-gray-400">
                  Post jobs, hire freelancers
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: 'freelancer' })
                }
                className={`p-4 rounded-lg border text-left transition
                ${
                  formData.role === 'freelancer'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20'
                }`}
              >
                <div className="text-lg font-semibold text-white mb-1">
                  Freelancer
                </div>
                <div className="text-xs text-gray-400">
                  Find jobs, deliver work
                </div>
              </button>

            </div>

            {/* NAME */}
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Full Name"
              className="h-12 px-4 bg-[rgb(60,54,76)] border border-white/20 text-white placeholder:text-gray-400"
            />

            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}

            {/* EMAIL */}
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              className="h-12 px-4 bg-[rgb(60,54,76)] border border-white/20 text-white placeholder:text-gray-400"
            />

            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email}</p>
            )}

            {/* PASSWORD */}
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Min 8 characters, 1 letter, 1 number"
              className="h-12 px-4 bg-[rgb(60,54,76)] border border-white/20 text-white placeholder:text-gray-400"
            />

            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password}</p>
            )}

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full h-12 text-base bg-purple-500 hover:bg-purple-600"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
}