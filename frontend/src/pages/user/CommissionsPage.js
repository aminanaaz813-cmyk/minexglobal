import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp } from 'lucide-react';
import { commissionAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';

const CommissionsPage = () => {
  const [data, setData] = useState({ commissions: [], summary: { lv_a: 0, lv_b: 0, lv_c: 0, total: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const response = await commissionAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="commissions-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="commissions-title">Commissions</h1>
        <p className="text-gray-400">Track your earnings from referrals</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
          data-testid="total-commission-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono" data-testid="total-commission-value">
            {formatCurrency(data.summary.total)}
          </div>
          <div className="text-sm text-gray-400">Total Earned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
          data-testid="lv-a-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-blue-400">LEVEL A</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono">
            {formatCurrency(data.summary.lv_a)}
          </div>
          <div className="text-sm text-gray-400">Direct Referrals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
          data-testid="lv-b-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-purple-400">LEVEL B</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono">
            {formatCurrency(data.summary.lv_b)}
          </div>
          <div className="text-sm text-gray-400">2nd Level</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
          data-testid="lv-c-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-violet-400">LEVEL C</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono">
            {formatCurrency(data.summary.lv_c)}
          </div>
          <div className="text-sm text-gray-400">3rd Level</div>
        </motion.div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="commission-history">
        <h2 className="text-2xl font-bold text-white mb-6">Commission History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Type</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">From User</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Percentage</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No commissions earned yet
                  </td>
                </tr>
              ) : (
                data.commissions.map((commission) => (
                  <tr key={commission.commission_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`commission-row-${commission.commission_id}`}>
                    <td className="py-4 px-4 text-gray-300">{formatDateTime(commission.created_at)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        commission.commission_type === 'LV_A' ? 'bg-blue-500/20 text-blue-400' :
                        commission.commission_type === 'LV_B' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-violet-500/20 text-violet-400'
                      }`}>
                        {commission.commission_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 font-mono text-sm">
                      {commission.from_user_id.substring(0, 12)}...
                    </td>
                    <td className="py-4 px-4 text-green-400 font-bold">{commission.percentage}%</td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(commission.amount)}</td>
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

export default CommissionsPage;
