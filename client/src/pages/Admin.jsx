import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Users, Briefcase, FileText, MessageSquare, Shield } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, skillsRes, aiRes] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers({ limit: 10 }),
        adminService.listSkills(),
        adminService.getAiUsage(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setSkills(skillsRes.data.skills);
      setAiLogs(aiRes.data.logs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleUserStatus = async (user) => {
    try {
      await adminService.setUserStatus(user._id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      const res = await adminService.createSkill({ name: newSkill.trim() });
      setSkills((prev) => [...prev, res.data.skill].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSkill('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add skill');
    }
  };

  const removeSkill = async (id) => {
    try {
      await adminService.deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete skill');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading admin panel...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Shield size={22} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={Briefcase} label="Jobs tracked" value={stats.totalJobs} />
        <StatCard icon={FileText} label="Resumes" value={stats.totalResumes} />
        <StatCard icon={MessageSquare} label="Interviews" value={stats.totalInterviews} />
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent users</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-400">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-gray-500">{u.email}</td>
                <td className="py-2 capitalize">{u.role}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-2">
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleUserStatus(u)} className="text-xs font-medium text-primary-600 hover:underline">
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Predefined skills</h2>
        <div className="mb-3 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button onClick={addSkill} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s._id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
              {s.name}
              <button onClick={() => removeSkill(s._id)} className="text-gray-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent AI usage</h2>
        <table className="w-full text-left text-xs">
          <thead className="uppercase text-gray-400">
            <tr>
              <th className="py-2">User</th>
              <th className="py-2">Feature</th>
              <th className="py-2">Status</th>
              <th className="py-2">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {aiLogs.map((log) => (
              <tr key={log._id}>
                <td className="py-2">{log.userId?.name || 'Unknown'}</td>
                <td className="py-2">{log.feature}</td>
                <td className="py-2">
                  <span className={log.status === 'success' ? 'text-green-600' : 'text-red-500'}>{log.status}</span>
                </td>
                <td className="py-2 text-gray-400">{log.durationMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
        {aiLogs.length === 0 && <p className="text-sm text-gray-400">No AI usage recorded yet.</p>}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
