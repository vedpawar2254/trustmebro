'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectUser, selectUserRole, selectUserPFI } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '../freelancer/dashboard/DashboardLayout';
import { authService, notificationService, type NotificationPreferences } from '@/lib/api/services';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);
  const pfi = useAuthStore(selectUserPFI);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setName(user.name);
    setEmail(user.email);

    // Fetch notification preferences
    const fetchNotifPrefs = async () => {
      try {
        const response = await notificationService.getPreferences();
        if (response.success && response.data) {
          setNotifPrefs(response.data);
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setLoadingNotifs(false);
      }
    };
    fetchNotifPrefs();
  }, [user, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const response = await authService.updateProfile({ name });
      if (response.success && response.data) {
        // Update the local auth store with new user data
        const updatedUser = {
          id: String(response.data.id),
          name: response.data.name,
          email: response.data.email,
          role: response.data.role as 'employer' | 'freelancer',
          pfi_score: response.data.pfi_score,
        };
        login(updatedUser, localStorage.getItem('access_token') || '');
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }

    setSaving(true);
    try {
      const response = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification();
      setMessage({ type: 'success', text: 'Verification email sent!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to send verification email' });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleToggleNotification = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifPrefs) return;

    // Optimistic update
    setNotifPrefs({ ...notifPrefs, [key]: value });

    try {
      const response = await notificationService.updatePreferences({ [key]: value });
      if (response.success && response.data) {
        setNotifPrefs(response.data);
      }
    } catch (err) {
      // Revert on error
      setNotifPrefs({ ...notifPrefs, [key]: !value });
      setMessage({ type: 'error', text: 'Failed to update notification preference' });
    }
  };

  const handleEmailFrequencyChange = async (frequency: 'immediate' | 'daily_digest' | 'weekly_digest') => {
    if (!notifPrefs) return;

    const prevFrequency = notifPrefs.email_frequency;
    setNotifPrefs({ ...notifPrefs, email_frequency: frequency });

    try {
      const response = await notificationService.updatePreferences({ email_frequency: frequency });
      if (response.success && response.data) {
        setNotifPrefs(response.data);
        setMessage({ type: 'success', text: 'Email frequency updated!' });
      }
    } catch (err) {
      setNotifPrefs({ ...notifPrefs, email_frequency: prevFrequency });
      setMessage({ type: 'error', text: 'Failed to update email frequency' });
    }
  };

  const handleResetNotifications = async () => {
    setSavingNotifs(true);
    try {
      const response = await notificationService.resetPreferences();
      if (response.success && response.data) {
        setNotifPrefs(response.data);
        setMessage({ type: 'success', text: 'Notification preferences reset to defaults' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset preferences' });
    } finally {
      setSavingNotifs(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-background">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-8">
          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-success/10 border border-success/30 text-success'
                  : 'bg-error/10 border border-error/30 text-error'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Account Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={role === 'employer' ? 'info' : 'success'}>
                      {role?.toUpperCase()}
                    </Badge>
                    {role === 'freelancer' && pfi !== undefined && (
                      <Badge variant="default">PFI: {pfi}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Email Verification */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">
                    Email verification status
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A verified email ensures you receive important notifications
                  </p>
                </div>
                <Button variant="secondary" onClick={handleResendVerification}>
                  Resend Verification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Preferences</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetNotifications}
                  disabled={savingNotifs || loadingNotifs}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNotifs ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading preferences...
                </div>
              ) : notifPrefs ? (
                <div className="space-y-6">
                  {/* Email Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Email Frequency
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'immediate', label: 'Immediate' },
                        { value: 'daily_digest', label: 'Daily Digest' },
                        { value: 'weekly_digest', label: 'Weekly Digest' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleEmailFrequencyChange(option.value as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            notifPrefs.email_frequency === option.value
                              ? 'bg-primary text-white'
                              : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Choose how often you want to receive email notifications
                    </p>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>

                    {[
                      { key: 'bid_notifications', label: 'New Bids', desc: 'Get notified when freelancers bid on your jobs' },
                      { key: 'assignment_notifications', label: 'Job Assignments', desc: 'Get notified when you are assigned to a job' },
                      { key: 'submission_notifications', label: 'New Submissions', desc: 'Get notified when work is submitted for review' },
                      { key: 'payment_notifications', label: 'Payments', desc: 'Get notified about escrow and payment updates' },
                      { key: 'deadline_reminders', label: 'Deadline Reminders', desc: 'Get reminded about upcoming deadlines' },
                      { key: 'ghost_warnings', label: 'Inactivity Warnings', desc: 'Get warned about inactivity on projects' },
                      { key: 'dispute_notifications', label: 'Disputes', desc: 'Get notified about dispute updates' },
                      { key: 'change_request_notifications', label: 'Change Requests', desc: 'Get notified about scope/budget change requests' },
                      { key: 'verification_results', label: 'Verification Results', desc: 'Get notified about submission verification results' },
                      { key: 'chat_notifications', label: 'Chat Messages', desc: 'Get notified about new chat messages' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleNotification(
                              item.key as keyof NotificationPreferences,
                              !notifPrefs[item.key as keyof NotificationPreferences]
                            )
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifPrefs[item.key as keyof NotificationPreferences]
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifPrefs[item.key as keyof NotificationPreferences]
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load preferences
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-error/30">
            <CardHeader>
              <CardTitle className="text-error">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">Logout</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
