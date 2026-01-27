import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Copy } from 'lucide-react';
import { userAPI } from '@/api';
import { formatCurrency, formatDate, copyToClipboard } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const TeamPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState({ direct: [], indirect: [] });
  const [loading, setLoading] = useState(true);
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const response = await userAPI.getTeam();
      setTeam(response.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
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
    <div className="space-y-8" data-testid="team-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="team-title">My Team</h1>
        <p className="text-gray-400">Manage your referrals and track team growth</p>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="referral-info">
        <h2 className="text-xl font-bold text-white mb-6">Referral Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Referral Code</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-white font-mono text-lg font-bold">
                {user?.referral_code}
              </div>
              <button
                onClick={() => handleCopy(user?.referral_code)}
                className="btn-secondary flex items-center gap-2"
                data-testid="copy-code-btn"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Referral Link</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-blue-400 text-sm break-all">
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy(referralLink)}
                className="btn-secondary flex items-center gap-2"
                data-testid="copy-link-btn"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
          data-testid="direct-count-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-white mb-2">{team.direct.length}</div>
              <div className="text-gray-400">Direct Referrals</div>
            </div>
            <UserPlus className="w-12 h-12 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
          data-testid="indirect-count-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-white mb-2">{team.indirect.length}</div>
              <div className="text-gray-400">Indirect Referrals</div>
            </div>
            <Users className="w-12 h-12 text-purple-400" />
          </div>
        </motion.div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="direct-referrals">
        <h2 className="text-2xl font-bold text-white mb-6">Direct Referrals ({team.direct.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Level</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Investment</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {team.direct.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No direct referrals yet. Share your referral link to start earning commissions!
                  </td>
                </tr>
              ) : (
                team.direct.map((member) => (
                  <tr key={member.user_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`direct-member-${member.user_id}`}>
                    <td className="py-4 px-4 text-white">{member.full_name}</td>
                    <td className="py-4 px-4 text-gray-400">{member.email}</td>
                    <td className="py-4 px-4">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                        Level {member.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(member.total_investment)}</td>
                    <td className="py-4 px-4 text-gray-400">{formatDate(member.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="indirect-referrals">
        <h2 className="text-2xl font-bold text-white mb-6">Indirect Referrals ({team.indirect.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Level</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Investment</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {team.indirect.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No indirect referrals yet
                  </td>
                </tr>
              ) : (
                team.indirect.map((member) => (
                  <tr key={member.user_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`indirect-member-${member.user_id}`}>
                    <td className="py-4 px-4 text-white">{member.full_name}</td>
                    <td className="py-4 px-4 text-gray-400">{member.email}</td>
                    <td className="py-4 px-4">
                      <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
                        Level {member.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(member.total_investment)}</td>
                    <td className="py-4 px-4 text-gray-400">{formatDate(member.created_at)}</td>
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

export default TeamPage;
