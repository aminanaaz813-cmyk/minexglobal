import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    usdt_wallet_address: '',
    show_qr_code: true,
    community_star_target: 28.0,
    community_star_bonus_min: 100.0,
    community_star_bonus_max: 1000.0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getSettings?.() || await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/settings`).then(r => r.json());
      if (response.data) {
        setSettings(response.data);
      } else {
        setSettings(response);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminAPI.updateSettings({
        ...settings,
        settings_id: 'default'
      });
      toast.success('Settings updated successfully!');
      loadSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-settings">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400">Configure platform parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Payment Settings
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">USDT Wallet Address *</label>
            <input
              type="text"
              value={settings.usdt_wallet_address}
              onChange={(e) => setSettings({ ...settings, usdt_wallet_address: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono"
              placeholder="Enter USDT wallet address"
              required
              data-testid="usdt-wallet-input"
            />
            <p className="text-xs text-gray-500 mt-2">Users will send deposits to this address</p>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_qr_code}
                onChange={(e) => setSettings({ ...settings, show_qr_code: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-900/50 border-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-2"
                data-testid="show-qr-toggle"
              />
              <span className="text-sm text-gray-300">Show QR Code on deposit page</span>
            </label>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Community Star Program</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Growth Target (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.community_star_target}
                onChange={(e) => setSettings({ ...settings, community_star_target: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                data-testid="star-target-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Bonus (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={settings.community_star_bonus_min}
                onChange={(e) => setSettings({ ...settings, community_star_bonus_min: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                data-testid="bonus-min-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Bonus (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={settings.community_star_bonus_max}
                onChange={(e) => setSettings({ ...settings, community_star_bonus_max: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                data-testid="bonus-max-input"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto btn-primary flex items-center justify-center gap-2 px-12"
          data-testid="save-settings-btn"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
