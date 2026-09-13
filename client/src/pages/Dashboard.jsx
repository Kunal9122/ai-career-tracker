import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import { Briefcase, CalendarCheck, Trophy, XCircle, Bookmark, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { CardSkeleton } from '../components/Skeleton';

const COLORS = ['#3d63f5', '#6d8fff', '#9bb6ff', '#c3d4ff', '#2c47e0', '#212f8f', '#dfe8ff', '#1f2b72'];

function StatCard({ icon: Icon, label, value, suffix }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value ?? '—'}
        {value != null && suffix ? <span className="text-sm font-normal text-gray-400"> {suffix}</span> : ''}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { summary, charts } = data;
  const hasActivity = summary.totalApplications > 0 || summary.savedJobs > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-sm text-gray-500">
        Profile completion: <span className="font-semibold text-primary-600">{user?.profileCompletion}%</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Briefcase} label="Total applications" value={summary.totalApplications} />
        <StatCard icon={CalendarCheck} label="This month" value={summary.applicationsThisMonth} />
        <StatCard icon={Target} label="Interviews" value={summary.interviews} />
        <StatCard icon={Trophy} label="Offers" value={summary.offers} />
        <StatCard icon={XCircle} label="Rejections" value={summary.rejections} />
        <StatCard icon={Bookmark} label="Saved jobs" value={summary.savedJobs} />
        <StatCard icon={Target} label="Avg resume match" value={summary.avgResumeMatchScore} suffix="%" />
        <StatCard icon={Trophy} label="Avg interview score" value={summary.avgInterviewScore} suffix="/10" />
      </div>

      {!hasActivity ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No activity yet. Add a job and start tracking applications to see your charts here.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Applications over time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts.applicationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3d63f5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Applications by status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts.applicationsByStatus} dataKey="count" nameKey="status" outerRadius={80}>
                  {charts.applicationsByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Applications by company">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.applicationsByCompany}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="company" fontSize={11} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#3d63f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Resume match score trend">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts.matchScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2c47e0" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Most frequently missing skills">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.missingSkills} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="skill" fontSize={11} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#6d8fff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Interview conversion rate">
            <div className="flex h-[220px] flex-col items-center justify-center">
              <p className="text-4xl font-bold text-primary-600">{charts.interviewConversionRate}%</p>
              <p className="mt-1 text-xs text-gray-400">of applications reached interview or offer stage</p>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
