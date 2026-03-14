'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '../freelancer/dashboard/DashboardLayout';
import { paymentService } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: number;
  type: 'escrow_funded' | 'payment_released' | 'refund' | 'platform_fee';
  amount: number;
  job_id: number;
  job_title: string;
  status: string;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  brand: string;
  is_default: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'methods'>('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingMethodId, setRemovingMethodId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    pendingPayments: 0,
    escrowBalance: 0,
  });

  const isEmployer = role === 'employer';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsRes, methodsRes] = await Promise.all([
          paymentService.getTransactionHistory().catch(() => ({ success: false, data: [] })),
          paymentService.getPaymentMethods().catch(() => ({ success: false, data: [] })),
        ]);

        if (transactionsRes.success && transactionsRes.data) {
          setTransactions(transactionsRes.data);

          // Calculate stats from transactions
          const earned = transactionsRes.data
            .filter((t: Transaction) => t.type === 'payment_released')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          const spent = transactionsRes.data
            .filter((t: Transaction) => t.type === 'escrow_funded')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

          setStats({
            totalEarned: earned,
            totalSpent: spent,
            pendingPayments: 0,
            escrowBalance: 0,
          });
        }

        if (methodsRes.success && methodsRes.data) {
          setPaymentMethods(methodsRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch payment data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleAddMethod = () => {
    // In a production app, this would integrate with Stripe Elements or similar
    // For now, show a placeholder modal
    setShowAddModal(true);
  };

  const handleRemoveMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setRemovingMethodId(methodId);
    setMessage(null);

    try {
      const response = await paymentService.removePaymentMethod(methodId);
      if (response.success) {
        setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
        setMessage({ type: 'success', text: 'Payment method removed successfully' });
      } else {
        throw new Error(response.error || 'Failed to remove payment method');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to remove payment method',
      });
    } finally {
      setRemovingMethodId(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await paymentService.setDefaultPaymentMethod(methodId);
      if (response.success) {
        setPaymentMethods((prev) =>
          prev.map((m) => ({
            ...m,
            is_default: m.id === methodId,
          }))
        );
        setMessage({ type: 'success', text: 'Default payment method updated' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update default method',
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'escrow_funded':
        return '🔒';
      case 'payment_released':
        return '💰';
      case 'refund':
        return '↩️';
      case 'platform_fee':
        return '📊';
      default:
        return '💳';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'escrow_funded':
        return 'Escrow Funded';
      case 'payment_released':
        return 'Payment Released';
      case 'refund':
        return 'Refund';
      case 'platform_fee':
        return 'Platform Fee';
      default:
        return type;
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-background">
        <h1 className="text-3xl font-bold text-foreground">
          {isEmployer ? 'Payments' : 'Earnings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEmployer
            ? 'Manage your escrow and payment history'
            : 'Track your earnings and payouts'}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-8">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {isEmployer ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
                    <div className="text-3xl font-bold text-foreground">
                      ${stats.totalSpent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">In Escrow</div>
                    <div className="text-3xl font-bold text-warning">
                      ${stats.escrowBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Released</div>
                    <div className="text-3xl font-bold text-success">
                      ${stats.totalEarned.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Pending</div>
                    <div className="text-3xl font-bold text-info">
                      ${stats.pendingPayments.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
                    <div className="text-3xl font-bold text-success">
                      ${stats.totalEarned.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Pending</div>
                    <div className="text-3xl font-bold text-warning">
                      ${stats.pendingPayments.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">In Escrow</div>
                    <div className="text-3xl font-bold text-info">
                      ${stats.escrowBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">This Month</div>
                    <div className="text-3xl font-bold text-foreground">
                      $0
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'methods'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Payment Methods
            </button>
          </div>

          {/* Content */}
          {activeTab === 'transactions' ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">
                            {getTransactionIcon(transaction.type)}
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">
                              {getTransactionLabel(transaction.type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.job_title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(transaction.created_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              transaction.type === 'payment_released'
                                ? 'text-success'
                                : transaction.type === 'refund'
                                ? 'text-warning'
                                : 'text-foreground'
                            }`}
                          >
                            {transaction.type === 'payment_released' ? '+' : '-'}$
                            {transaction.amount.toLocaleString()}
                          </div>
                          <Badge
                            variant={
                              transaction.status === 'completed'
                                ? 'success'
                                : transaction.status === 'pending'
                                ? 'warning'
                                : 'muted'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="💳"
                    title="No transactions yet"
                    description={
                      isEmployer
                        ? 'Transactions will appear here when you fund escrow for jobs'
                        : 'Transactions will appear here when you receive payments'
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Methods</CardTitle>
                  <Button variant="primary" size="sm" onClick={handleAddMethod}>
                    + Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">💳</span>
                          <div>
                            <div className="font-semibold text-foreground">
                              {method.brand} •••• {method.last_four}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {method.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {method.is_default ? (
                            <Badge variant="success">Default</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(method.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMethod(method.id)}
                            disabled={removingMethodId === method.id}
                          >
                            {removingMethodId === method.id ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="💳"
                    title="No payment methods"
                    description="Add a payment method to fund escrow or receive payouts"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    How payments work on trustmebro
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>
                      • <strong>Escrow Protection:</strong> All payments are held in escrow until
                      work is verified and approved
                    </li>
                    <li>
                      • <strong>AI Verification:</strong> Submissions are automatically scored
                      using our 60-30-10 verification system
                    </li>
                    <li>
                      • <strong>Platform Fee:</strong> A 10% platform fee is deducted from each
                      payment to cover AI verification and platform costs
                    </li>
                    <li>
                      • <strong>Auto-Release:</strong> If an employer doesn't respond within 48
                      hours, payment is automatically released to the freelancer
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Add Payment Method</h2>
            <p className="text-muted-foreground mb-6">
              Payment method integration is coming soon. In production, this would integrate
              with Stripe or another payment processor to securely collect card details.
            </p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="text-sm font-medium">Stripe Integration</p>
                  <p className="text-xs">Secure payment processing with PCI compliance</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAddModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
