import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Sparkles, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { aiService } from '../services/aiService';
import { jobService } from '../services/jobService';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const MODES = ['HR', 'Technical', 'Mixed', 'Role-specific'];

export default function Interview() {
  const [sessions, setSessions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({ defaultValues: { mode: 'Mixed', count: 6 } });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await interviewService.list();
      setSessions(res.data.sessions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    jobService.list({ limit: 50 }).then((res) => setJobs(res.data.jobs)).catch(() => {});
  }, []);

  const onGenerate = async (data) => {
    setGenerating(true);
    try {
      const res = await aiService.interviewQuestions({
        mode: data.mode,
        count: Number(data.count),
        jobId: data.jobId || undefined,
      });
      navigate(`/interview/${res.data.session._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate interview questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await interviewService.remove(pendingDelete._id);
      toast.success('Session deleted');
      setPendingDelete(null);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session');
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Mock Interviews</h1>

      <form onSubmit={handleSubmit(onGenerate)} className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Mode</label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('mode')}>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Questions</label>
          <input type="number" min={3} max={15} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('count')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Target job (optional)</label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('jobId')}>
            <option value="">General / target role</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>{j.position} at {j.company}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Start new interview
        </button>
      </form>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : sessions.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No mock interviews yet" description="Generate your first set of interview questions above." />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <Link to={`/interview/${s._id}`} className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {s.mode} interview {s.jobId ? `· ${s.jobId.position} at ${s.jobId.company}` : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.questions.length} questions · {s.status === 'completed' ? `Overall score: ${s.overallScore}/10` : 'In progress'}
                  </p>
                </Link>
                <button onClick={() => setPendingDelete(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this session?"
        message="This interview session and its feedback will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
