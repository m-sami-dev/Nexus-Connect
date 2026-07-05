import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Send } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { authService } from '../../services/authService';
import {
  depositFunds,
  withdrawFunds,
  transferFunds,
  fetchTransactions,
} from '../../services/paymentService';

type ActiveTab = 'deposit' | 'withdraw' | 'transfer';

export const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('deposit');
  const [amount, setAmount] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profile, txns] = await Promise.all([
        authService.getProfile(),
        fetchTransactions(),
      ]);
      setBalance(parseFloat(profile.wallet_balance) || 0);
      setTransactions(txns);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load wallet data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setAmount('');
    setReceiverEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    try {
      setSubmitting(true);
      let result;

      if (activeTab === 'deposit') {
        result = await depositFunds(numericAmount);
      } else if (activeTab === 'withdraw') {
        result = await withdrawFunds(numericAmount);
      } else {
        if (!receiverEmail) {
          setMessage({ type: 'error', text: 'Please enter the recipient email.' });
          setSubmitting(false);
          return;
        }
        result = await transferFunds(numericAmount, receiverEmail);
      }

      setBalance(parseFloat(result.wallet_balance));
      setMessage({ type: 'success', text: `${activeTab} completed successfully.` });
      resetForm();
      const txns = await fetchTransactions();
      setTransactions(txns);
    } catch (err: any) {
      const errorText = err.response?.data?.error || `Failed to ${activeTab}.`;
      setMessage({ type: 'error', text: errorText });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'deposit', label: 'Deposit', icon: <ArrowDownCircle size={18} /> },
    { key: 'withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={18} /> },
    { key: 'transfer', label: 'Transfer', icon: <Send size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600">Manage deposits, withdrawals, and transfers</p>
      </div>

      {/* Balance card */}
      <Card className="bg-primary-50 border border-primary-100">
        <CardBody>
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full mr-4">
              <Wallet size={22} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700">Current Balance</p>
              <h2 className="text-2xl font-bold text-primary-900">
                {loading ? '...' : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </h2>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMessage(null);
                    resetForm();
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>
            {message && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Amount (USD)"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                fullWidth
              />

              {activeTab === 'transfer' && (
                <Input
                  label="Recipient Email"
                  type="email"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  fullWidth
                />
              )}

              {activeTab === 'deposit' && (
                <p className="text-xs text-gray-500">
                  Uses Stripe test mode — no real card is charged.
                </p>
              )}

              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? 'Processing...' : `Confirm ${activeTab}`}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Transaction history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <p className="text-center py-8 text-gray-600">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Details</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td className="px-4 py-3 capitalize font-medium text-gray-900">
                          {txn.transaction_type}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {txn.transaction_type === 'transfer'
                            ? `${txn.sender_name ?? '—'} → ${txn.receiver_name ?? '—'}`
                            : txn.transaction_type === 'deposit'
                            ? `To ${txn.receiver_name ?? 'wallet'}`
                            : `From ${txn.sender_name ?? 'wallet'}`}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          ${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(txn.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};