import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, Trash2, Pencil, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import { jobService } from '../services/jobService';
import useDebounce from '../hooks/useDebounce';
import EmptyState from '../components/EmptyState';
import { RowSkeleton } from '../components/Skeleton';
import ConfirmDialog from '../components/ConfirmDialog';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [pendingDelete, setPendingDelete] = useState(null);

  const debouncedSearch = useDebounce(search);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobService.list({
        q: debouncedSearch || undefined,
        jobType: jobType || undefined,
        sortBy,
        page,
        limit: 10,
      });
      setJobs(res.data.jobs);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, jobType, sortBy, page]);

  const handleDelete = async () => {
    try {
      await jobService.remove(pendingDelete._id);
      toast.success('Job deleted');
      setPendingDelete(null);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          to="/jobs/new"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} /> Add job
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by company, position, or skill..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={jobType}
          onChange={(e) => {
            setPage(1);
            setJobType(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="company">Company A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Add a job manually to start tracking it, or adjust your search filters."
          action={
            <Link to="/jobs/new" className="text-sm font-medium text-primary-600 hover:underline">
              + Add your first job
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link to={`/jobs/${job._id}`} className="hover:text-primary-600 hover:underline">
                      {job.position}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.company}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {job.location || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{job.jobType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/jobs/${job._id}`} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => setPendingDelete(job)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-lg ${
                page === i + 1 ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this job?"
        message={`This will also remove any application linked to "${pendingDelete?.position}". This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
