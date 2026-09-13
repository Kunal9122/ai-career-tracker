import api from './api';

export const applicationService = {
  list: (params) => api.get('/applications', { params }).then((r) => r.data),
  getById: (id) => api.get(`/applications/${id}`).then((r) => r.data),
  create: (payload) => api.post('/applications', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/applications/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/applications/${id}`).then((r) => r.data),
};
