import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { aiService } from '../services/aiService';

export default function Analysis() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    jobService.list({ limit: 50 }).then((res) => setJobs(res.data.jobs)).catch(() => {});
    resumeService.list().then((res) => setResumes(res.data.resumes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    const job = jobs.find((j) => j._id === selectedJobId);
    if (job) setJobDescription(job.description || '');
  }, [selectedJobId, jobs]);

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) {
      toast.error('Paste a job description first');
      return;
    }
    setAnalyzing(true);
    setJdAnalysis(null);
    try {
      const res = await aiService.analyzeJob(jobDescription, selectedJobId || undefined);
      setJdAnalysis(res.data.analysis);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Job analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedResumeId || !selectedJobId) {
      toast.error('Select both a resume and a saved job to match against');
      return;
    }
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await aiService.matchResume(selectedResumeId, selectedJobId);
      setMatchResult(res.data.analysis);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume matching failed');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume & Job Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">Analyze a job description, then match it against your resume.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">1. Job description</h2>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">— Paste manually (or select a saved job) —</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.position} at {j.company}
            </option>
          ))}
        </select>
        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAnalyzeJob}
          disabled={analyzing}
          className="mt-3 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Analyze with AI
        </button>

        {jdAnalysis && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <SkillList title="Required skills" skills={jdAnalysis.requiredSkills} icon={CheckCircle2} tone="green" />
            <SkillList title="Preferred skills" skills={jdAnalysis.preferredSkills} icon={CheckCircle2} tone="blue" />
            <div className="sm:col-span-2">
              <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Experience & education</h3>
              <p className="text-sm text-gray-600">{jdAnalysis.experienceRequirements || '—'}</p>
              <p className="text-sm text-gray-600">{jdAnalysis.educationRequirements || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Key responsibilities</h3>
              <ul className="list-inside list-disc text-sm text-gray-600">
                {jdAnalysis.responsibilities?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">2. Match against your resume</h2>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select a resume</option>
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fileName} {r.isPrimary ? '(primary)' : ''}
              </option>
            ))}
          </select>
          <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select a saved job</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.position} at {j.company}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleMatch}
          disabled={matching}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {matching ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Match resume
        </button>

        {matchResult && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-primary-600">{matchResult.matchScore}%</span>
              <span className="text-sm text-gray-500">match score</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SkillList title="Matched skills" skills={matchResult.matchedSkills} icon={CheckCircle2} tone="green" />
              <SkillList title="Missing skills" skills={matchResult.missingSkills} icon={XCircle} tone="red" />
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Strengths</h3>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {matchResult.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Weaknesses</h3>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {matchResult.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Recommendations</h3>
                <ol className="list-inside list-decimal text-sm text-gray-600">
                  {matchResult.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillList({ title, skills, icon: Icon, tone }) {
  const colors = { green: 'text-green-600', red: 'text-red-500', blue: 'text-blue-600' };
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">{title}</h3>
      {skills?.length ? (
        <ul className="space-y-1 text-sm text-gray-600">
          {skills.map((s, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <Icon size={13} className={colors[tone]} /> {s}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">None</p>
      )}
    </div>
  );
}
