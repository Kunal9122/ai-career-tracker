import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      location: user?.location || '',
      skills: user?.skills?.join(', ') || '',
      targetRoles: user?.targetRoles?.join(', ') || '',
      preferredLocations: user?.preferredLocations?.join(', ') || '',
      education: user?.education?.length ? user.education : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'education' });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        location: data.location,
        skills: data.skills.split(',').map((s) => s.trim()).filter(Boolean),
        targetRoles: data.targetRoles.split(',').map((s) => s.trim()).filter(Boolean),
        preferredLocations: data.preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
        education: data.education,
      };
      const res = await authService.updateProfile(payload);
      updateUser(res.data.user);
      reset(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          {user?.profileCompletion}% complete
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('name')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('phone')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('location')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input disabled value={user?.email || ''} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Skills (comma separated)</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="React, Node.js, MongoDB" {...register('skills')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Target roles (comma separated)</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="MERN Developer, Frontend Engineer" {...register('targetRoles')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Preferred locations (comma separated)</label>
          <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Bangalore, Remote" {...register('preferredLocations')} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Education</label>
            <button
              type="button"
              onClick={() => append({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '' })}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-5">
                <input placeholder="Degree" className="rounded border border-gray-300 px-2 py-1.5 text-sm sm:col-span-2" {...register(`education.${index}.degree`)} />
                <input placeholder="Institution" className="rounded border border-gray-300 px-2 py-1.5 text-sm sm:col-span-2" {...register(`education.${index}.institution`)} />
                <button type="button" onClick={() => remove(index)} className="flex items-center justify-center rounded border border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {fields.length === 0 && <p className="text-xs text-gray-400">No education added yet.</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
