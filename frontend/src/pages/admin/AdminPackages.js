import React, { useState, useEffect } from 'react';
import { adminAPI, membershipAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    level: '',
    min_investment: '',
    daily_roi: '',
    annual_roi: '',
    duration_days: 365,
    direct_required: 0,
    indirect_required: 0,
    commission_lv_a: 0,
    commission_lv_b: 0,
    commission_lv_c: 0,
    is_active: true
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await membershipAPI.getPackages();
      setPackages(response.data);
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const packageData = {
        ...formData,
        package_id: editingPackage?.package_id || `pkg_${Date.now()}`,
        level: parseInt(formData.level),
        min_investment: parseFloat(formData.min_investment),
        daily_roi: parseFloat(formData.daily_roi),
        annual_roi: parseFloat(formData.annual_roi),
        duration_days: parseInt(formData.duration_days),
        direct_required: parseInt(formData.direct_required),
        indirect_required: parseInt(formData.indirect_required),
        commission_lv_a: parseFloat(formData.commission_lv_a),
        commission_lv_b: parseFloat(formData.commission_lv_b),
        commission_lv_c: parseFloat(formData.commission_lv_c),
        created_at: new Date().toISOString()
      };

      if (editingPackage) {
        await adminAPI.updateMembershipPackage(editingPackage.package_id, packageData);
        toast.success('Package updated successfully!');
      } else {
        await adminAPI.createMembershipPackage(packageData);
        toast.success('Package created successfully!');
      }

      setShowDialog(false);
      setEditingPackage(null);
      resetForm();
      loadPackages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      level: '',
      min_investment: '',
      daily_roi: '',
      annual_roi: '',
      duration_days: 365,
      direct_required: 0,
      indirect_required: 0,
      commission_lv_a: 0,
      commission_lv_b: 0,
      commission_lv_c: 0,
      is_active: true
    });
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      level: pkg.level,
      min_investment: pkg.min_investment,
      daily_roi: pkg.daily_roi,
      annual_roi: pkg.annual_roi,
      duration_days: pkg.duration_days || 365,
      direct_required: pkg.direct_required || 0,
      indirect_required: pkg.indirect_required || 0,
      commission_lv_a: pkg.commission_lv_a || 0,
      commission_lv_b: pkg.commission_lv_b || 0,
      commission_lv_c: pkg.commission_lv_c || 0,
      is_active: pkg.is_active
    });
    setShowDialog(true);
  };

  const calculateAnnualROI = (dailyROI) => {
    return (parseFloat(dailyROI) * 365).toFixed(1);
  };

  return (
    <div className="space-y-8" data-testid="admin-packages">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Membership Packages</h1>
          <p className="text-gray-400">Create and manage investment packages</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPackage(null);
            setShowDialog(true);
          }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          data-testid="create-package-btn"
        >
          <Plus className="w-5 h-5" />
          Create Package
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.package_id}
            className="glass rounded-2xl p-6 hover:border-blue-500/50 transition-all group"
            data-testid={`package-card-${pkg.level}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Level {pkg.level}</h3>
                <div className="text-2xl font-black text-gradient mt-2">{formatCurrency(pkg.min_investment)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                  data-testid={`edit-package-${pkg.level}`}
                >
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Daily ROI</span>
                <span className="text-green-400 font-bold">{pkg.daily_roi}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Annual ROI</span>
                <span className="text-blue-400 font-bold">{pkg.annual_roi}%</span>
              </div>
              {pkg.direct_required > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Requirements</span>
                  <span className="text-white font-bold">{pkg.direct_required}D / {pkg.indirect_required}I</span>
                </div>
              )}
            </div>

            {pkg.level >= 2 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">Commission Rates</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-400">{pkg.commission_lv_a}%</div>
                    <div className="text-xs text-gray-500">Lv.A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-400">{pkg.commission_lv_b}%</div>
                    <div className="text-xs text-gray-500">Lv.B</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-violet-400">{pkg.commission_lv_c}%</div>
                    <div className="text-xs text-gray-500">Lv.C</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-950 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="package-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {editingPackage ? 'Edit Package' : 'Create Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level *</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  min="1"
                  max="10"
                  data-testid="level-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Investment *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_investment}
                  onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  data-testid="min-investment-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily ROI (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.daily_roi}
                  onChange={(e) => {
                    const dailyROI = e.target.value;
                    setFormData({ 
                      ...formData, 
                      daily_roi: dailyROI,
                      annual_roi: calculateAnnualROI(dailyROI)
                    });
                  }}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  data-testid="daily-roi-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Annual ROI (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.annual_roi}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-gray-400"
                  readOnly
                  data-testid="annual-roi-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days) *</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  min="1"
                  data-testid="duration-days-input"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Direct Referrals</label>
                  <input
                    type="number"
                    value={formData.direct_required}
                    onChange={(e) => setFormData({ ...formData, direct_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                    min="0"
                    data-testid="direct-required-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Indirect Referrals</label>
                  <input
                    type="number"
                    value={formData.indirect_required}
                    onChange={(e) => setFormData({ ...formData, indirect_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                    min="0"
                    data-testid="indirect-required-input"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-bold text-white mb-4">Commission Rates (%)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level A</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_lv_a}
                    onChange={(e) => setFormData({ ...formData, commission_lv_a: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                    min="0"
                    max="100"
                    data-testid="commission-a-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level B</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_lv_b}
                    onChange={(e) => setFormData({ ...formData, commission_lv_b: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                    min="0"
                    max="100"
                    data-testid="commission-b-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level C</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_lv_c}
                    onChange={(e) => setFormData({ ...formData, commission_lv_c: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                    min="0"
                    max="100"
                    data-testid="commission-c-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                data-testid="submit-package-btn"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
              </button>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-6 py-3 font-bold"
                data-testid="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
