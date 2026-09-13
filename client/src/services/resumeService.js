import api from './api';

export const resumeService = {
  list: () => api.get('/resumes').then((r) => r.data),
  getById: (id) => api.get(`/resumes/${id}`).then((r) => r.data),
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api
      .post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
      .then((r) => r.data);
  },
  remove: (id) => api.delete(`/resumes/${id}`).then((r) => r.data),
  setPrimary: (id) => api.put(`/resumes/${id}/primary`).then((r) => r.data),
};
