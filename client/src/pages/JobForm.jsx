import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jobService } from '../services/jobService';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!isEdit) return;
    jobService
      .getById(id)
      .then((res) => {
        const job = res.data.job;
        reset({
          ...job,
          requiredSkills: job.requiredSkills?.join(', ') || '',
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : '',
        });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load job'))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        requiredSkills: data.requiredSkills
          ? data.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (isEdit) {
        await jobService.update(id, payload);
        toast.success('Job updated');
      } else {
        await jobService.create(payload);
        toast.success('Job added');
      }
      navigate('/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{isEdit ? 'Edit job' : 'Add a job'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('company', { required: 'Company is required' })} />
            {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Position</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('position', { required: 'Position is required' })} />
            {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('location')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Job type</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('jobType')}>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Salary</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. 8-12 LPA" {...register('salary')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Application deadline</label>
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('applicationDeadline')} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Job URL</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('jobUrl')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Required skills (comma separated)</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="React, Node.js, MongoDB" {...register('requiredSkills')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Job description</label>
          <textarea rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('description')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('notes')} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
