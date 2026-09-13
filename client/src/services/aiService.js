import api from './api';

export const aiService = {
  parseResume: (resumeId) => api.post('/ai/parse-resume', { resumeId }).then((r) => r.data),
  analyzeJob: (jobDescription, jobId) => api.post('/ai/analyze-job', { jobDescription, jobId }).then((r) => r.data),
  matchResume: (resumeId, jobId) => api.post('/ai/match-resume', { resumeId, jobId }).then((r) => r.data),
  atsAnalysis: (resumeId, jobId) => api.post('/ai/ats-analysis', { resumeId, jobId }).then((r) => r.data),
  improveResume: (sectionName, sectionText) =>
    api.post('/ai/improve-resume', { sectionName, sectionText }).then((r) => r.data),
  skillGap: (jobId) => api.post('/ai/skill-gap', { jobId }).then((r) => r.data),
  interviewQuestions: (payload) => api.post('/ai/interview-questions', payload).then((r) => r.data),
  interviewFeedback: (payload) => api.post('/ai/interview-feedback', payload).then((r) => r.data),
  chat: (message) => api.post('/ai/chat', { message }).then((r) => r.data),
};
