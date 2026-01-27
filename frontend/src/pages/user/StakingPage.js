import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Clock } from 'lucide-react';
import { stakingAPI } from '@/api';
import { formatCurrency, formatDateTime, getRemainingTime } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const StakingPage = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [userStakes, setUserStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesRes, stakesRes] = await Promise.all([
        stakingAPI.getPackages(),
        stakingAPI.getUserStaking()
      ]);
      setPackages(packagesRes.data);
      setUserStakes(stakesRes.data);
    } catch (error) {
      toast.error('Failed to load staking data');
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await stakingAPI.create({
        staking_id: selectedPackage.staking_id,
        amount: parseFloat(stakeAmount),
        lock_period_days: lockPeriod
      });

      toast.success('Staking created successfully!');
      setSelectedPackage(null);
      setStakeAmount('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create stake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="staking-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="staking-title">Staking</h1>
        <p className="text-gray-400">Lock your assets and earn daily yields</p>
      </div>

      <div className="glass rounded-2xl p-6" data-testid="balance-info">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-white font-mono" data-testid="available-balance">
              {formatCurrency(user?.wallet_balance || 0)}
            </div>
          </div>
          <Zap className="w-12 h-12 text-yellow-400" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Staking Packages</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.staking_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass glass-hover rounded-2xl p-6 cursor-pointer"
              onClick={() => setSelectedPackage(pkg)}
              data-testid={`staking-package-${pkg.tier}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-blue-400">TIER {pkg.tier}</div>
                <div className="text-sm text-gray-500">{pkg.remaining_supply.toLocaleString()} left</div>
              </div>
              
              <div className="text-2xl font-bold text-gradient mb-4">
                {formatCurrency(pkg.min_amount)} - {formatCurrency(pkg.max_amount)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Daily Yield</span>
                  <span className="text-green-400 font-bold">{pkg.daily_yield}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="text-white font-bold">{pkg.total_supply.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lock Period</span>
                  <span className="text-white font-bold">3-30 Days</span>
                </div>
              </div>

              <button
                className="w-full mt-6 btn-primary text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPackage(pkg);
                }}
                data-testid={`stake-now-btn-${pkg.tier}`}
              >
                Stake Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedPackage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
          data-testid="staking-form"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Stake in Tier {selectedPackage.tier}</h2>
            <button
              onClick={() => setSelectedPackage(null)}
              className="text-gray-400 hover:text-white"
              data-testid="close-form-btn"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleStake} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stake Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                placeholder={`Min: ${formatCurrency(selectedPackage.min_amount)}, Max: ${formatCurrency(selectedPackage.max_amount)}`}
                min={selectedPackage.min_amount}
                max={Math.min(selectedPackage.max_amount, user?.wallet_balance || 0)}
                required
                data-testid="stake-amount-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Lock Period: {lockPeriod} Days</label>
              <input
                type="range"
                min="3"
                max="30"
                value={lockPeriod}
                onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                className="w-full"
                data-testid="lock-period-slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>3 Days</span>
                <span>30 Days</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Daily Yield</div>
                  <div className="text-green-400 font-bold text-lg">{selectedPackage.daily_yield}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Estimated Earnings</div>
                  <div className="text-white font-bold text-lg font-mono">
                    {stakeAmount ? formatCurrency(parseFloat(stakeAmount) * (selectedPackage.daily_yield / 100) * lockPeriod) : '$0.00'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="submit-stake-btn"
            >
              {loading ? 'Creating Stake...' : 'Create Stake'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-8" data-testid="user-stakes">
        <h2 className="text-2xl font-bold text-white mb-6">My Stakes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {userStakes.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-500">
              No active stakes
            </div>
          ) : (
            userStakes.map((stake) => (
              <div key={stake.staking_entry_id} className="glass rounded-xl p-6" data-testid={`stake-${stake.staking_entry_id}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-bold">Stake #{stake.staking_entry_id.substring(0, 8)}</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    stake.status === 'active' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {stake.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-white font-bold font-mono">{formatCurrency(stake.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Daily Yield</span>
                    <span className="text-green-400 font-bold">{stake.daily_yield}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total Earned</span>
                    <span className="text-white font-bold font-mono">{formatCurrency(stake.total_earned)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">End Date</span>
                    <span className="text-white font-bold">{formatDateTime(stake.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-bold">{getRemainingTime(stake.end_date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingPage;
