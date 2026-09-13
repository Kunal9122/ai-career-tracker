import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { applicationService } from '../services/applicationService';

const STATUSES = ['Saved', 'Applied', 'Screening', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  const load = () => {
    applicationService
      .getById(id)
      .then((res) => {
        setApplication(res.data.application);
        reset({
          status: res.data.application.status,
          interviewDate: res.data.application.interviewDate?.slice(0, 10) || '',
          notes: res.data.application.notes || '',
          recruiterName: res.data.application.recruiter?.name || '',
          recruiterEmail: res.data.application.recruiter?.email || '',
        });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load application'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const onSubmit = async (data) => {
    try {
      await applicationService.update(id, {
        status: data.status,
        interviewDate: data.interviewDate || undefined,
        notes: data.notes,
        recruiter: { name: data.recruiterName, email: data.recruiterEmail },
      });
      toast.success('Application updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!application) return <p className="text-sm text-gray-500">Application not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/applications" className="text-xs text-primary-600 hover:underline">
        ← Back to board
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold text-gray-900">{application.jobId?.position}</h1>
      <p className="mb-6 text-gray-500">{application.jobId?.company}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Interview date</label>
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('interviewDate')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Recruiter name</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('recruiterName')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Recruiter email</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('recruiterEmail')} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('notes')} />
        </div>
        <button type="submit" className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          Save changes
        </button>
      </form>

      {application.statusHistory?.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Status history</h2>
          <ol className="space-y-2 border-l border-gray-200 pl-4">
            {application.statusHistory.map((h, idx) => (
              <li key={idx} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{h.status}</span> — {new Date(h.changedAt).toLocaleString()}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
