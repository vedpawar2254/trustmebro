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
      newErrors.password = 'Password must be at least 8 characters with 1 letter and 1 number';
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
      // TODO: Replace with actual API call
      // const response = await api.post('/auth/register', formData);

      // Mock successful registration for now
      const mockUser = {
        id: 'user_123',
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      const mockToken = 'mock_jwt_token';

      login(mockUser, mockToken);

      // Redirect to appropriate dashboard
      const redirectUrl = formData.role === 'employer'
        ? '/employer/dashboard'
        : '/freelancer/dashboard';
      router.push(redirectUrl);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      if (error.response?.data?.error) {
        setErrors({ email: error.response.data.error });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">trustmebro</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`flex-1 p-4 border-2 rounded-lg ${
                    formData.role === 'employer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'employer' })}
                >
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="font-semibold text-foreground">Employer</div>
                  <div className="text-sm text-muted-foreground">
                    Post jobs, hire freelancers
                  </div>
                </button>
                <button
                  type="button"
                  className={`flex-1 p-4 border-2 rounded-lg ${
                    formData.role === 'freelancer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-semibold text-foreground">Freelancer</div>
                  <div className="text-sm text-muted-foreground">
                    Find jobs, deliver work
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={errors.name ? 'border-error' : ''}
              />
              {errors.name && (
                <p className="text-error text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className={errors.email ? 'border-error' : ''}
              />
              {errors.email && (
                <p className="text-error text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 characters, 1 letter, 1 number"
                className={errors.password ? 'border-error' : ''}
              />
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
