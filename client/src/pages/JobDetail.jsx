import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, DollarSign, ExternalLink, Pencil } from 'lucide-react';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    jobService
      .getById(id)
      .then((res) => setJob(res.data.job))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTrackApplication = async () => {
    setApplying(true);
    try {
      const res = await applicationService.create({ jobId: id, status: 'Saved' });
      toast.success('Added to your application board');
      navigate(`/applications/${res.data.application._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!job) return <p className="text-sm text-gray-500">Job not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.position}</h1>
          <p className="text-gray-500">{job.company}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/jobs/${id}/edit`} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Pencil size={14} /> Edit
          </Link>
          <button
            onClick={handleTrackApplication}
            disabled={applying}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {applying ? 'Adding...' : 'Track application'}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1">
            <DollarSign size={14} /> {job.salary}
          </span>
        )}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{job.jobType}</span>
        {job.jobUrl && (
          <a href={job.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
            <ExternalLink size={14} /> Job posting
          </a>
        )}
      </div>

      {job.requiredSkills?.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Required skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.description && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Description</h2>
          <p className="whitespace-pre-line text-sm text-gray-600">{job.description}</p>
        </div>
      )}

      {job.notes && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Notes</h2>
          <p className="whitespace-pre-line text-sm text-gray-600">{job.notes}</p>
        </div>
      )}
    </div>
  );
}
