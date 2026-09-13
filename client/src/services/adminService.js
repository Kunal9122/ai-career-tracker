import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  listUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  setUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  listSkills: () => api.get('/admin/skills').then((r) => r.data),
  createSkill: (payload) => api.post('/admin/skills', payload).then((r) => r.data),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`).then((r) => r.data),
  getAiUsage: () => api.get('/admin/ai-usage').then((r) => r.data),
};
