import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getDashboard: () => api.get('/user/dashboard'),
  getTeam: () => api.get('/user/team'),
};

export const depositAPI = {
  create: (data) => api.post('/deposits', data),
  getAll: () => api.get('/deposits'),
  uploadScreenshot: (depositId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/deposits/${depositId}/upload-screenshot`, formData);
  },
};

export const withdrawalAPI = {
  create: (data) => api.post('/withdrawals', data),
  getAll: () => api.get('/withdrawals'),
};

export const stakingAPI = {
  getPackages: () => api.get('/staking/packages'),
  create: (data) => api.post('/staking', data),
  getUserStaking: () => api.get('/staking'),
};

export const commissionAPI = {
  getAll: () => api.get('/commissions'),
};

export const membershipAPI = {
  getPackages: () => api.get('/membership/packages'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/admin/settings', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getDeposits: () => api.get('/admin/deposits'),
  approveDeposit: (depositId) => api.post(`/admin/deposits/${depositId}/approve`),
  rejectDeposit: (depositId, reason) => api.post(`/admin/deposits/${depositId}/reject`, null, { params: { reason } }),
  getWithdrawals: () => api.get('/admin/withdrawals'),
  approveWithdrawal: (withdrawalId, transactionHash) => api.post(`/admin/withdrawals/${withdrawalId}/approve`, null, { params: { transaction_hash: transactionHash } }),
  rejectWithdrawal: (withdrawalId, reason) => api.post(`/admin/withdrawals/${withdrawalId}/reject`, null, { params: { reason } }),
  createMembershipPackage: (data) => api.post('/admin/membership/packages', data),
  updateMembershipPackage: (packageId, data) => api.put(`/admin/membership/packages/${packageId}`, data),
  createStakingPackage: (data) => api.post('/admin/staking/packages', data),
  updateStakingPackage: (stakingId, data) => api.put(`/admin/staking/packages/${stakingId}`, data),
  updateSettings: (data) => api.put('/admin/settings', data),
  getSettings: () => api.get('/settings'),
  calculateROI: () => api.post('/admin/calculate-roi'),
};

export default api;
