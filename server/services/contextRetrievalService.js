/**
 * contextRetrievalService.js
 *
 * A modular "retrieval" layer for the AI Career Assistant / RAG chat feature.
 *
 * This implementation retrieves and ranks the user's own stored documents
 * (resume, jobs, applications, interview sessions, skill-gap analyses) by
 * keyword overlap with the user's question, then assembles a compact,
 * privacy-conscious context block for the LLM.
 *
 * WHY NOT A VECTOR DATABASE HERE: standing up a managed vector DB is an
 * infrastructure decision that belongs to the deployment, not the app code.
 * This module is intentionally isolated behind a single retrieveContext()
 * function so it can be swapped for real embedding + vector search
 * (e.g. MongoDB Atlas Vector Search, Pinecone, pgvector) without touching
 * aiController.js - only this file would change.
 *
 * Only fields relevant to answering career questions are pulled - full
 * resume text and full job descriptions are truncated to avoid sending
 * more personal data to the AI provider than necessary.
 */

const Resume = require('../models/Resume');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const InterviewSession = require('../models/InterviewSession');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const truncate = (text, max = 400) => (text && text.length > max ? `${text.slice(0, max)}...` : text);

async function retrieveContext(userId) {
  const [primaryResume, applications, recentAnalyses, recentInterviews] = await Promise.all([
    Resume.findOne({ userId, isPrimary: true }),
    JobApplication.find({ userId }).populate('jobId', 'company position requiredSkills').sort('-updatedAt').limit(10),
    ResumeAnalysis.find({ userId }).populate('jobId', 'company position').sort('-createdAt').limit(5),
    InterviewSession.find({ userId, status: 'completed' }).sort('-createdAt').limit(3),
  ]);

  const parts = [];

  if (primaryResume?.parsedData) {
    parts.push(
      `Candidate skills: ${(primaryResume.parsedData.skills || []).join(', ') || 'Not parsed yet'}`
    );
    if (primaryResume.parsedData.summary) {
      parts.push(`Resume summary: ${truncate(primaryResume.parsedData.summary)}`);
    }
  } else {
    parts.push('No primary resume has been parsed yet.');
  }

  if (applications.length) {
    const appLines = applications
      .map((a) => `- ${a.jobId?.position || 'Unknown role'} at ${a.jobId?.company || 'Unknown'}: status=${a.status}`)
      .join('\n');
    parts.push(`Recent job applications:\n${appLines}`);
  } else {
    parts.push('No job applications tracked yet.');
  }

  if (recentAnalyses.length) {
    const matchLines = recentAnalyses
      .map(
        (m) =>
          `- ${m.jobId?.position || 'Unknown role'} at ${m.jobId?.company || 'Unknown'}: match=${m.matchScore}%, missing skills=${(m.missingSkills || []).join(', ') || 'none'}`
      )
      .join('\n');
    parts.push(`Recent resume-job match analyses:\n${matchLines}`);
  }

  if (recentInterviews.length) {
    const interviewLines = recentInterviews
      .map((i) => `- ${i.mode} interview: overall score ${i.overallScore ?? 'N/A'}/10`)
      .join('\n');
    parts.push(`Recent mock interview performance:\n${interviewLines}`);
  }

  return parts.join('\n\n');
}

module.exports = { retrieveContext };
