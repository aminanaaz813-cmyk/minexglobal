import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { withdrawalAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const WithdrawPage = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    wallet_address: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const response = await withdrawalAPI.getAll();
      setWithdrawals(response.data);
    } catch (error) {
      toast.error('Failed to load withdrawals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await withdrawalAPI.create({
        amount: parseFloat(formData.amount),
        wallet_address: formData.wallet_address
      });

      toast.success('Withdrawal request submitted!');
      setShowForm(false);
      setFormData({ amount: '', wallet_address: '' });
      loadWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="space-y-8" data-testid="withdraw-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="withdraw-title">Withdrawals</h1>
          <p className="text-gray-400">Request withdrawals from your wallet balance</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          data-testid="new-withdrawal-btn"
        >
          {showForm ? 'Cancel' : 'New Withdrawal'}
        </button>
      </div>

      <div className="glass rounded-2xl p-6" data-testid="balance-info">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-white font-mono" data-testid="available-balance">
              {formatCurrency(user?.wallet_balance || 0)}
            </div>
          </div>
          <Send className="w-12 h-12 text-blue-400" />
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
          data-testid="withdrawal-form"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Request Withdrawal</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                placeholder="Enter amount"
                max={user?.wallet_balance || 0}
                required
                data-testid="withdrawal-amount-input"
              />
              <div className="text-xs text-gray-500 mt-2">
                Maximum: {formatCurrency(user?.wallet_balance || 0)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">USDT Wallet Address</label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono"
                placeholder="Enter your USDT wallet address"
                required
                data-testid="wallet-address-input"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <div className="font-bold mb-1">Important Notice</div>
                  <div>Withdrawal requests are processed manually by admin. Please ensure your wallet address is correct.</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="submit-withdrawal-btn"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-8" data-testid="withdrawal-history">
        <h2 className="text-2xl font-bold text-white mb-6">Withdrawal History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Wallet Address</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    No withdrawals yet
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.withdrawal_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`withdrawal-row-${withdrawal.withdrawal_id}`}>
                    <td className="py-4 px-4 text-gray-300">{formatDateTime(withdrawal.created_at)}</td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(withdrawal.amount)}</td>
                    <td className="py-4 px-4 text-gray-400 font-mono text-sm">
                      {withdrawal.wallet_address.substring(0, 16)}...
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center gap-2 ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="capitalize font-medium">{withdrawal.status}</span>
                      </div>
                      {withdrawal.rejection_reason && (
                        <div className="text-xs text-red-400 mt-1">{withdrawal.rejection_reason}</div>
                      )}
                      {withdrawal.transaction_hash && (
                        <div className="text-xs text-green-400 mt-1 font-mono">
                          TX: {withdrawal.transaction_hash.substring(0, 20)}...
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
