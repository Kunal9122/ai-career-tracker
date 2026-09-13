import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard').then((r) => r.data),
};
