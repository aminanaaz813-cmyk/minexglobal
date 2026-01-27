import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/api';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Upload, Image, X, Calendar, Calculator } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    usdt_wallet_address: '',
    qr_code_image: null,
    withdrawal_dates: [1, 15],
    community_star_target: 28.0,
    community_star_bonus_min: 100.0,
    community_star_bonus_max: 1000.0
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roiLoading, setRoiLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      if (response.data) {
        setSettings({
          ...response.data,
          withdrawal_dates: response.data.withdrawal_dates || [1, 15]
        });
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

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const response = await adminAPI.uploadQRCode(file);
      setSettings({ ...settings, qr_code_image: response.data.qr_code_image });
      toast.success('QR code uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  const handleCalculateROI = async () => {
    setRoiLoading(true);
    try {
      const response = await adminAPI.calculateROI();
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to calculate ROI');
    } finally {
      setRoiLoading(false);
    }
  };

  const toggleWithdrawalDate = (day) => {
    const dates = settings.withdrawal_dates || [];
    if (dates.includes(day)) {
      setSettings({ ...settings, withdrawal_dates: dates.filter(d => d !== day) });
    } else {
      setSettings({ ...settings, withdrawal_dates: [...dates, day].sort((a, b) => a - b) });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="admin-settings">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400 text-sm">Configure platform parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Settings */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Payment Settings
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">USDT Wallet Address *</label>
              <input
                type="text"
                value={settings.usdt_wallet_address}
                onChange={(e) => setSettings({ ...settings, usdt_wallet_address: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm"
                placeholder="Enter USDT wallet address (TRC20)"
                required
                data-testid="usdt-wallet-input"
              />
              <p className="text-xs text-gray-500 mt-2">Users will send deposits to this address</p>
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment QR Code</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-32 h-32 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden"
                >
                  {settings.qr_code_image ? (
                    <img src={settings.qr_code_image} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <Image className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-xs text-gray-500">Upload QR</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary flex items-center gap-2 mb-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload QR Code'}
                  </button>
                  <p className="text-xs text-gray-500">
                    Upload a QR code image for your USDT wallet. This will be shown on the user's deposit page.
                  </p>
                  {settings.qr_code_image && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, qr_code_image: null })}
                      className="text-red-400 text-xs mt-2 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove QR Code
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Settings */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Withdrawal Settings
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Allowed Withdrawal Dates</label>
            <p className="text-xs text-gray-500 mb-4">Select the days of the month when users can withdraw</p>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWithdrawalDate(day)}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    (settings.withdrawal_dates || []).includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Selected: {(settings.withdrawal_dates || []).length > 0 
                ? settings.withdrawal_dates.join(', ') 
                : 'All days (no restriction)'}
            </p>
          </div>
        </div>

        {/* Community Star Program */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5">Community Star Program</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Growth Target (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.community_star_target}
                onChange={(e) => setSettings({ ...settings, community_star_target: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
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
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
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
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                data-testid="bonus-max-input"
              />
            </div>
          </div>
        </div>

        {/* ROI Calculation */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Daily ROI Distribution
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Click the button below to manually distribute daily ROI to all active stakers. 
            This should typically be run once per day.
          </p>
          <button
            type="button"
            onClick={handleCalculateROI}
            disabled={roiLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {roiLoading ? 'Calculating...' : 'Calculate & Distribute ROI'}
          </button>
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
