import api from './api';

export const interviewService = {
  list: () => api.get('/interviews').then((r) => r.data),
  getById: (id) => api.get(`/interviews/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/interviews/${id}`).then((r) => r.data),
};
