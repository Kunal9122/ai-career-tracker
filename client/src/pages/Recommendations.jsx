import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';
import EmptyState from '../components/EmptyState';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    recommendationService
      .list()
      .then((res) => {
        setRecommendations(res.data.recommendations);
        setMessage(res.message);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Recommended Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">
        Matched against your profile skills, from jobs already saved in the app. This does not pull from live external job boards.
      </p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : recommendations.length === 0 ? (
          <EmptyState icon={Sparkles} title="No recommendations yet" description={message || 'Add skills to your profile and jobs to the app to get matches.'} />
        ) : (
          <div className="space-y-3">
            {recommendations.map(({ job, matchScore, matchedSkills, missingSkills }) => (
              <div key={job._id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/jobs/${job._id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600">
                      {job.position}
                    </Link>
                    <p className="text-xs text-gray-500">{job.company} {job.location ? `· ${job.location}` : ''}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">{matchScore}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {matchedSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={12} /> {s}
                    </span>
                  ))}
                  {missingSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 text-gray-400">
                      <XCircle size={12} /> {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
