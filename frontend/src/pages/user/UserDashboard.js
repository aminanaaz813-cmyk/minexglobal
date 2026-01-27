import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Users, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { userAPI, membershipAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, packagesRes] = await Promise.all([
        userAPI.getDashboard(),
        membershipAPI.getPackages()
      ]);
      setStats(statsRes.data);
      setPackages(packagesRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentPackage = packages.find(p => p.level === stats?.current_level);
  const nextPackage = packages.find(p => p.level === stats?.current_level + 1);

  return (
    <div className="space-y-8" data-testid="user-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="dashboard-title">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your portfolio overview</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
          data-testid="total-balance-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-300" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono" data-testid="total-balance-value">
            {formatCurrency(stats?.total_balance || 0)}
          </div>
          <div className="text-sm text-blue-200">Total Balance</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
          data-testid="roi-balance-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-300" />
            </div>
            <span className="text-green-300 text-sm font-bold bg-green-500/20 px-3 py-1 rounded-full">{stats?.daily_roi_percentage}%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono" data-testid="roi-balance-value">
            {formatCurrency(stats?.roi_balance || 0)}
          </div>
          <div className="text-sm text-green-200">ROI Earnings</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          data-testid="commission-balance-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Gift className="w-6 h-6 text-purple-300" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono" data-testid="commission-balance-value">
            {formatCurrency(stats?.commission_balance || 0)}
          </div>
          <div className="text-sm text-purple-200">Commission Earned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20"
          data-testid="team-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Users className="w-6 h-6 text-orange-300" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1" data-testid="team-count-value">
            {stats?.direct_referrals || 0} / {stats?.indirect_referrals || 0}
          </div>
          <div className="text-sm text-orange-200">Direct / Indirect</div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6" data-testid="current-level-card">
          <h2 className="text-xl font-bold text-white mb-6">Current Level</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Level</span>
              <span className="text-2xl font-bold text-gradient">Level {stats?.current_level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Daily ROI</span>
              <span className="text-green-400 font-bold">{stats?.daily_roi_percentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Investment</span>
              <span className="text-white font-bold font-mono">{formatCurrency(stats?.total_investment || 0)}</span>
            </div>
            {currentPackage && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="text-sm text-gray-500 mb-2">Commission Rates</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{currentPackage.commission_lv_a}%</div>
                    <div className="text-xs text-gray-500">Lv.A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{currentPackage.commission_lv_b}%</div>
                    <div className="text-xs text-gray-500">Lv.B</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-violet-400">{currentPackage.commission_lv_c}%</div>
                    <div className="text-xs text-gray-500">Lv.C</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6" data-testid="next-level-card">
          <h2 className="text-xl font-bold text-white mb-6">Next Level Progress</h2>
          {nextPackage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Target Level</span>
                <span className="text-2xl font-bold text-gradient">Level {nextPackage.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Required Investment</span>
                <span className="text-white font-bold font-mono">{formatCurrency(nextPackage.min_investment)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Direct Referrals</span>
                <span className="text-white font-bold">{stats?.direct_referrals} / {nextPackage.direct_required}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Indirect Referrals</span>
                <span className="text-white font-bold">{stats?.indirect_referrals} / {nextPackage.indirect_required}</span>
              </div>
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="text-sm text-gray-500 mb-2">Unlock Commission Rates</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{nextPackage.commission_lv_a}%</div>
                    <div className="text-xs text-gray-500">Lv.A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{nextPackage.commission_lv_b}%</div>
                    <div className="text-xs text-gray-500">Lv.B</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-violet-400">{nextPackage.commission_lv_c}%</div>
                    <div className="text-xs text-gray-500">Lv.C</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏆</div>
              <div className="text-lg text-white font-bold">Maximum Level Reached!</div>
              <div className="text-gray-400 text-sm mt-2">You're at the highest tier</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6" data-testid="quick-stats-card">
        <h2 className="text-xl font-bold text-white mb-6">Quick Stats</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-2">Total Commissions</div>
            <div className="text-2xl font-bold text-white font-mono">{formatCurrency(stats?.total_commissions || 0)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Pending Withdrawals</div>
            <div className="text-2xl font-bold text-white">{stats?.pending_withdrawals || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Team Size</div>
            <div className="text-2xl font-bold text-white">{(stats?.direct_referrals || 0) + (stats?.indirect_referrals || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
