import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../services/notificationService';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = () => {
    notificationService
      .list()
      .then((res) => {
        setNotifications(res.data.notifications.slice(0, 8));
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // light polling, no websocket infra in this build
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`border-b border-gray-50 px-4 py-3 text-sm ${n.read ? '' : 'bg-primary-50/50'}`}>
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
