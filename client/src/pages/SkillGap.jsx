import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Sparkles, Loader2, Target } from 'lucide-react';
import { jobService } from '../services/jobService';
import { aiService } from '../services/aiService';
import EmptyState from '../components/EmptyState';

export default function SkillGap() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    jobService.list({ limit: 50 }).then((res) => setJobs(res.data.jobs)).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await aiService.skillGap(selectedJobId || undefined);
      setResult(res.data.result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Skill gap analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
      <p className="mt-1 text-sm text-gray-500">See what's missing between your current skills and your target role.</p>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Aggregate across all your saved jobs</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.position} at {j.company}
            </option>
          ))}
        </select>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Analyze skill gap
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-green-700">Skills you have</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.skillsYouHave?.map((s) => (
                  <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-green-700 ring-1 ring-green-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-red-700">Skills missing</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.skillsMissing?.map((s) => (
                  <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-red-600 ring-1 ring-red-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Priority</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PriorityBucket label="High" skills={result.priority?.high} tone="bg-red-50 text-red-600" />
              <PriorityBucket label="Medium" skills={result.priority?.medium} tone="bg-amber-50 text-amber-600" />
              <PriorityBucket label="Low" skills={result.priority?.low} tone="bg-gray-100 text-gray-600" />
            </div>
          </div>

          {result.explanations?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Why these skills matter</h3>
              <div className="space-y-2">
                {result.explanations.map((e, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-800">{e.skill}</p>
                    <p className="text-sm text-gray-500">{e.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.roadmap?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Learning roadmap</h3>
              <ol className="space-y-3 border-l border-gray-200 pl-4">
                {result.roadmap.map((r, i) => (
                  <li key={i}>
                    <p className="text-sm font-semibold text-primary-600">{r.period}: {r.focus}</p>
                    <p className="text-sm text-gray-500">{r.details}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="mt-6">
          <EmptyState icon={Target} title="No analysis yet" description="Run an analysis to see your personalized skill gap and roadmap." />
        </div>
      )}
    </div>
  );
}

function PriorityBucket({ label, skills, tone }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-1">
        {skills?.length ? (
          skills.map((s) => (
            <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>
              {s}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-300">None</span>
        )}
      </div>
    </div>
  );
}
