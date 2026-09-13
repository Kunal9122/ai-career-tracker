import api from './api';

export const recommendationService = {
  list: () => api.get('/recommendations').then((r) => r.data),
};
