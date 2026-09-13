import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, FileText, Star, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { aiService } from '../services/aiService';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null); // resume currently being parsed/ATS-scored
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeService.list();
      setResumes(res.data.resumes);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    setUploading(true);
    try {
      await resumeService.upload(file);
      toast.success('Resume uploaded');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParse = async (resume) => {
    setBusyId(resume._id);
    try {
      await aiService.parseResume(resume._id);
      toast.success('Resume parsed');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse resume');
    } finally {
      setBusyId(null);
    }
  };

  const handleAts = async (resume) => {
    setBusyId(resume._id);
    try {
      const res = await aiService.atsAnalysis(resume._id);
      toast.success(`ATS estimate: ${res.data.result.atsScore}/100`);
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run ATS analysis');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetPrimary = async (resume) => {
    try {
      await resumeService.setPrimary(resume._id);
      toast.success('Primary resume updated');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update primary resume');
    }
  };

  const handleDelete = async () => {
    try {
      await resumeService.remove(pendingDelete._id);
      toast.success('Resume deleted');
      setPendingDelete(null);
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resume');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload PDF'}
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : resumes.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes yet" description="Upload a PDF resume to get started with AI parsing and ATS scoring." />
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div key={resume._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-primary-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{resume.fileName}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                      {resume.isPrimary && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
                          <Star size={11} fill="currentColor" /> Primary
                        </span>
                      )}
                      <span className="capitalize">
                        Parse status: {resume.parseStatus}
                      </span>
                      {resume.atsScore != null && <span>· ATS estimate: {resume.atsScore}/100</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!resume.isPrimary && (
                    <button onClick={() => handleSetPrimary(resume)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      Set primary
                    </button>
                  )}
                  <button
                    onClick={() => handleParse(resume)}
                    disabled={busyId === resume._id}
                    className="flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-60"
                  >
                    {busyId === resume._id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Parse with AI
                  </button>
                  <button
                    onClick={() => handleAts(resume)}
                    disabled={busyId === resume._id}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    ATS score
                  </button>
                  <button onClick={() => setPendingDelete(resume)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {resume.parsedData?.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
                  {resume.parsedData.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {resume.parseStatus === 'failed' && resume.parseError && (
                <p className="mt-2 text-xs text-red-500">Parse error: {resume.parseError}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this resume?"
        message={`"${pendingDelete?.fileName}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
