import api from './api';

export const jobService = {
  list: (params) => api.get('/jobs', { params }).then((r) => r.data),
  getById: (id) => api.get(`/jobs/${id}`).then((r) => r.data),
  create: (payload) => api.post('/jobs', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/jobs/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/jobs/${id}`).then((r) => r.data),
};
