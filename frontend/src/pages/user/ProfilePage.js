import React from 'react';
import { useAuth } from '../../AuthContext';
import { User, Mail, Shield, Copy } from 'lucide-react';
import { formatDate, copyToClipboard } from '../../utils';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user } = useAuth();
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="profile-title">Profile</h1>
        <p className="text-gray-400">Manage your account information</p>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="user-info">
        <h2 className="text-2xl font-bold text-white mb-6">User Information</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-xl">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Full Name</div>
              <div className="text-lg text-white font-bold">{user?.full_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500/10 rounded-xl">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Email Address</div>
              <div className="text-lg text-white">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-500/10 rounded-xl">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Member Since</div>
              <div className="text-lg text-white">{formatDate(user?.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="referral-info">
        <h2 className="text-2xl font-bold text-white mb-6">Referral Information</h2>
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
    </div>
  );
};

export default ProfilePage;
