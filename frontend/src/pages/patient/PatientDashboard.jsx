import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { consentApi, documentApi, appointmentApi, userApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  Sparkles,
  Upload,
  Download,
  Eye,
  Archive,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  XCircle,
  Stethoscope,
  Building2,
  User,
  Filter,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function PatientDashboard({ onOpenAiAssistantWithConsent }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [consents, setConsents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Document Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', documentType: 'LAB_REPORT', description: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Book Appointment Modal State
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '09:30',
    reason: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const [consentsRes, docsRes, apptsRes, doctorsRes] = await Promise.all([
        consentApi.getMyConsents().catch((e) => ({ data: { data: [] } })),
        documentApi.getMyDocuments().catch((e) => ({ data: { data: [] } })),
        appointmentApi.getMyAppointments().catch((e) => ({ data: { data: [] } })),
        userApi.getDoctors().catch((e) => ({ data: { data: [] } })),
      ]);

      if (consentsRes.data?.data) setConsents(consentsRes.data.data);
      if (docsRes.data?.data) setDocuments(docsRes.data.data);
      if (apptsRes.data?.data) setAppointments(apptsRes.data.data);
      if (doctorsRes.data?.data) {
        setDoctors(doctorsRes.data.data);
        if (doctorsRes.data.data.length > 0 && !appointmentForm.doctorId) {
          setAppointmentForm((prev) => ({ ...prev, doctorId: doctorsRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load patient dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadForm.title);
      formData.append('documentType', uploadForm.documentType);
      formData.append('description', uploadForm.description);

      await documentApi.upload(formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadForm({ title: '', documentType: 'LAB_REPORT', description: '' });
      loadPatientData();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Ensure file is under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (docId, originalFilename) => {
    try {
      const res = await documentApi.download(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  const handleArchiveDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to archive this document from your active library?')) return;
    try {
      await documentApi.archive(docId);
      loadPatientData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive document');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);

    try {
      await appointmentApi.create({
        doctorId: Number(appointmentForm.doctorId),
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        reason: appointmentForm.reason,
      });

      setAppointmentModalOpen(false);
      setAppointmentForm({
        doctorId: doctors[0]?.id || '',
        appointmentDate: '',
        appointmentTime: '09:30',
        reason: '',
      });
      loadPatientData();
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book appointment. Please check availability.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) return;
    try {
      await appointmentApi.updateStatus(id, { status: 'CANCELLED' });
      loadPatientData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pendingConsents = consents.filter((c) => c.status === 'PENDING_REVIEW');
  const activeAppointments = appointments.filter((a) => a.status === 'REQUESTED' || a.status === 'CONFIRMED');

  const todayStr = new Date().toISOString().split('T')[0];

  if (loading && consents.length === 0 && documents.length === 0 && appointments.length === 0) {
    return <LoadingSpinner size="lg" text="Loading your patient portal..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-hospital-700 to-hospital-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-hospital-500/30 text-hospital-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-hospital-400/30">
            Patient Portal &bull; Medical Records &bull; Digital Consents
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-hospital-100/90 leading-relaxed">
            Review and digitally sign authorized surgical and procedure consent agreements, schedule clinical appointments, browse your diagnostic medical library, and use your AI assistant to translate clinical terminology.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Blood Group: <strong>{user.additionalInfo || 'O+'}</strong>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Active Consents: <strong>{consents.length}</strong>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Scheduled Appointments: <strong>{appointments.length}</strong>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Stored Documents: <strong>{documents.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'overview' })}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            currentTab === 'overview'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview &amp; Action Items
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'consents' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            currentTab === 'consents'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Consents ({consents.length})</span>
          {pendingConsents.length > 0 && (
            <span className="ml-1 bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingConsents.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'appointments' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            currentTab === 'appointments'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments ({appointments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'documents' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            currentTab === 'documents'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Documents ({documents.length})</span>
        </button>
      </div>

      {/* Urgent Action Needed Alert */}
      {(currentTab === 'overview' || currentTab === 'consents') && pendingConsents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
            <h2 className="text-sm font-bold">
              Action Required: You have {pendingConsents.length} consent request{pendingConsents.length > 1 ? 's' : ''} awaiting your review and digital signature
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingConsents.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-hospital-700">{c.consentNumber}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{c.procedureName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.procedureDescription || c.consentText}</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Requesting Physician: <strong>Dr. {c.doctor?.fullName}</strong> ({c.doctor?.departmentName})
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenAiAssistantWithConsent && onOpenAiAssistantWithConsent(c.id)}
                    className="flex items-center space-x-1 text-xs font-bold text-hospital-600 hover:text-hospital-800 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Terms with AI</span>
                  </button>
                  <Link
                    to={`/consents/${c.id}`}
                    className="px-3 py-1.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    Review &amp; Sign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Appointments (Shown when tab is 'overview' or 'appointments') */}
      {(currentTab === 'overview' || currentTab === 'appointments') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-hospital-600" />
                <h2 className="text-base font-bold text-slate-900">Clinical Appointments</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Schedule consultations with hospital physicians and track your appointment status</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingError('');
                setAppointmentModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No appointments scheduled yet. Click &quot;Book Appointment&quot; above to schedule a visit with our hospital physicians.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Doctor &amp; Department</th>
                    <th className="px-6 py-3.5">Scheduled Date &amp; Time</th>
                    <th className="px-6 py-3.5">Reason for Visit</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Physician Notes</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{a.doctorName}</span>
                        <span className="text-[10px] text-hospital-600 font-semibold block">{a.departmentName} &bull; {a.doctorSpecialization}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div>{a.appointmentDate}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{a.appointmentTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={a.reason}>
                        {a.reason}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px] italic">
                        {a.doctorNotes || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(a.status === 'REQUESTED' || a.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(a.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION: All Consent Agreements (Shown when tab is 'overview' or 'consents') */}
      {(currentTab === 'overview' || currentTab === 'consents') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-hospital-600" />
              <h2 className="text-base font-bold text-slate-900">My Procedure Consent Agreements</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {consents.length}</span>
          </div>

          {consents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No procedure consent requests have been assigned to you yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Consent Number</th>
                    <th className="px-6 py-3.5">Procedure</th>
                    <th className="px-6 py-3.5">Attending Doctor</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Request Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {consents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-hospital-700">{c.consentNumber}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{c.procedureName}</span>
                        <span className="text-[10px] text-slate-400 block">Version {c.consentVersion}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">Dr. {c.doctor?.fullName}</span>
                        <span className="text-[10px] text-slate-400 block">{c.doctor?.departmentName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => onOpenAiAssistantWithConsent && onOpenAiAssistantWithConsent(c.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                          title="Translate medical terms in this consent form"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">AI Help</span>
                        </button>
                        <Link
                          to={`/consents/${c.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Medical Document Library (Shown when tab is 'overview' or 'documents') */}
      {(currentTab === 'overview' || currentTab === 'documents') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Medical Document Library</h2>
              <p className="text-xs text-slate-400">Secure private storage with SHA-256 integrity verification</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No medical documents in your library. Upload your lab reports, prescriptions, or imaging files above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Document Title</th>
                    <th className="px-6 py-3.5">Classification</th>
                    <th className="px-6 py-3.5">File Size</th>
                    <th className="px-6 py-3.5">SHA-256 Checksum</th>
                    <th className="px-6 py-3.5">Upload Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">{doc.originalFilename}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{doc.documentType}</td>
                      <td className="px-6 py-4 text-slate-500">{formatFileSize(doc.fileSizeBytes)}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={doc.checksumSha256}>
                        {doc.checksumSha256.substring(0, 14)}...
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc.id, doc.originalFilename)}
                          className="p-1.5 text-slate-600 hover:text-hospital-600 hover:bg-hospital-50 rounded-lg transition"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Archive Document"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal isOpen={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} title="Schedule Clinical Appointment">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {bookingError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {bookingError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Attending Physician *</label>
            <select
              value={appointmentForm.doctorId}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.fullName} — {d.departmentName} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                min={todayStr}
                value={appointmentForm.appointmentDate}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Time *</label>
              <select
                value={appointmentForm.appointmentTime}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit / Symptoms *</label>
            <textarea
              rows={3}
              required
              minLength={5}
              maxLength={500}
              value={appointmentForm.reason}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
              placeholder="Describe primary concerns, existing pain, follow-up purpose..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setAppointmentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookingLoading || !appointmentForm.appointmentDate || !appointmentForm.reason}
              className="px-5 py-2 bg-hospital-600 hover:bg-hospital-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              {bookingLoading ? 'Checking & Booking...' : 'Confirm Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Medical Document">
        <form onSubmit={handleUploadDocument} className="space-y-4">
          {uploadError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. Chest X-Ray Report, Blood Panel"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Type *</label>
            <select
              value={uploadForm.documentType}
              onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            >
              <option value="LAB_REPORT">Lab Report</option>
              <option value="IMAGING">Imaging / Radiology</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="GENERAL">General Health Record</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">File Attachment (Safe formats: PDF, PNG, JPG, DOCX, TXT) *</label>
            <input
              type="file"
              required
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-hospital-50 file:text-hospital-700 hover:file:bg-hospital-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Any comments, clinic source, or notes..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="px-5 py-2 bg-hospital-600 hover:bg-hospital-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              {uploading ? 'Verifying & Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
