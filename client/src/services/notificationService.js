import api from './api';

export const notificationService = {
  list: (unreadOnly) => api.get('/notifications', { params: unreadOnly ? { unreadOnly: 'true' } : {} }).then((r) => r.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.put('/notifications/read-all').then((r) => r.data),
};
