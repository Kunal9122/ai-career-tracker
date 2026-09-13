import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Building2 } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import EmptyState from '../components/EmptyState';

const STATUSES = ['Saved', 'Applied', 'Screening', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const STATUS_COLORS = {
  Saved: 'bg-gray-100 text-gray-600',
  Applied: 'bg-blue-50 text-blue-600',
  Screening: 'bg-indigo-50 text-indigo-600',
  Assessment: 'bg-purple-50 text-purple-600',
  Interview: 'bg-amber-50 text-amber-600',
  Offer: 'bg-green-50 text-green-600',
  Rejected: 'bg-red-50 text-red-600',
  Withdrawn: 'bg-gray-100 text-gray-500',
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.list({ limit: 100 });
      setApplications(res.data.applications);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (application, newStatus) => {
    // Optimistic update for a snappy board
    setApplications((prev) =>
      prev.map((a) => (a._id === application._id ? { ...a, status: newStatus } : a))
    );
    try {
      await applicationService.update(application._id, { status: newStatus });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      fetchApplications();
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading board...</p>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No applications yet"
        description="Save a job and create an application to see your Kanban board."
        action={
          <Link to="/jobs" className="text-sm font-medium text-primary-600 hover:underline">
            Browse your jobs
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Application Board</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const items = applications.filter((a) => a.status === status);
          return (
            <div key={status} className="w-72 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
                <span className="text-xs text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((app) => (
                  <div key={app._id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <Link to={`/applications/${app._id}`} className="block text-sm font-semibold text-gray-900 hover:text-primary-600">
                      {app.jobId?.position || 'Untitled role'}
                    </Link>
                    <p className="text-xs text-gray-500">{app.jobId?.company}</p>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      className="mt-2 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-300">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
