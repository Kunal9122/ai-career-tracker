import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Sparkles, Loader2 } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { aiService } from '../services/aiService';

export default function InterviewSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getById(id);
      setSession(res.data.session);
      const firstUnanswered = res.data.session.questions.findIndex((q) => !q.answer);
      setActiveIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Write an answer before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const res = await aiService.interviewFeedback({ sessionId: id, questionIndex: activeIndex, answer });
      setSession(res.data.session);
      setAnswer('');
      const nextUnanswered = res.data.session.questions.findIndex((q) => !q.answer);
      if (nextUnanswered !== -1) setActiveIndex(nextUnanswered);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!session) return <p className="text-sm text-gray-500">Session not found.</p>;

  const question = session.questions[activeIndex];
  const isCompleted = session.status === 'completed';

  return (
    <div className="max-w-3xl">
      <Link to="/interview" className="text-xs text-primary-600 hover:underline">← Back to interviews</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold text-gray-900">{session.mode} Interview</h1>

      {isCompleted && (
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-4">
          <ScoreBox label="Technical" value={session.technicalScore} />
          <ScoreBox label="Communication" value={session.communicationScore} />
          <ScoreBox label="Confidence" value={session.confidenceScore} />
          <ScoreBox label="Overall" value={session.overallScore} highlight />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {session.questions.map((q, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIndex(i);
              setAnswer(q.answer || '');
            }}
            className={`h-8 w-8 rounded-full text-xs font-medium ${
              i === activeIndex
                ? 'bg-primary-600 text-white'
                : q.answer
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{question.category}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{question.difficulty}</span>
        </div>
        <p className="mb-4 text-base font-medium text-gray-900">{question.question}</p>

        <textarea
          rows={5}
          value={question.answer ? question.answer : answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!question.answer}
          placeholder="Type your answer..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        />

        {!question.answer && (
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting}
            className="mt-3 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Submit answer
          </button>
        )}

        {question.feedback && (
          <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <MiniScore label="Correct" value={question.feedback.correctness} />
              <MiniScore label="Relevant" value={question.feedback.relevance} />
              <MiniScore label="Complete" value={question.feedback.completeness} />
              <MiniScore label="Comm." value={question.feedback.communication} />
              <MiniScore label="Confidence" value={question.feedback.confidence} />
              <MiniScore label="Depth" value={question.feedback.technicalDepth} />
            </div>
            <p className="text-sm text-gray-600">{question.feedback.comments}</p>
            {question.feedback.betterAnswer && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">A stronger answer might look like</p>
                <p className="text-sm text-gray-600">{question.feedback.betterAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBox({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-primary-50' : 'bg-gray-50'}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-primary-600' : 'text-gray-800'}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function MiniScore({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <p className="text-sm font-semibold text-gray-800">{value}/10</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
