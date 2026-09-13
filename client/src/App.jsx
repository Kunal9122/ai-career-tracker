import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Resumes from './pages/Resumes';
import Analysis from './pages/Analysis';
import SkillGap from './pages/SkillGap';
import Interview from './pages/Interview';
import InterviewSessionPage from './pages/InterviewSessionPage';
import Recommendations from './pages/Recommendations';
import AiAssistant from './pages/AiAssistant';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/edit" element={<JobForm />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/skill-gap" element={<SkillGap />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/interview/:id" element={<InterviewSessionPage />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
