import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Bell, Lock } from 'lucide-react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

export default function Settings() {
  const [notifications, setNotifications] = useState([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    notificationService.list().then((res) => setNotifications(res.data.notifications)).catch(() => {});
  }, []);

  const onChangePassword = async (data) => {
    try {
      await authService.changePassword(data);
      toast.success('Password changed');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Change password</h2>
        </div>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('currentPassword', { required: true })}
          />
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('newPassword', { required: true, minLength: 8 })}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            Update password
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Notifications</h2>
          </div>
          <button onClick={markAllRead} className="text-xs font-medium text-primary-600 hover:underline">
            Mark all as read
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n._id} className={`rounded-lg p-3 text-sm ${n.read ? 'bg-gray-50 text-gray-500' : 'bg-primary-50 text-gray-800'}`}>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
