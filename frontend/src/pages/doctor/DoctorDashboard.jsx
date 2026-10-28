import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { consentApi, userApi, documentApi, appointmentApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  FileText,
  Users,
  Eye,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  XCircle,
  Check,
  ClipboardCheck,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'consents';

  const [consents, setConsents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Consent Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [consentForm, setConsentForm] = useState({
    patientId: '',
    procedureName: '',
    procedureDescription: '',
    consentText: '',
    risksAndAlternatives: '',
    validUntil: '',
    doctorNotes: '',
  });
  const [createError, setCreateError] = useState('');

  // Patient Document View Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDocs, setPatientDocs] = useState([]);
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  // Upload Doc for Patient Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', documentType: 'LAB_REPORT', description: '' });
  const [uploading, setUploading] = useState(false);

  // Appointment Action Modal State
  const [apptActionModalOpen, setApptActionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [targetApptStatus, setTargetApptStatus] = useState('CONFIRMED');
  const [doctorApptNotes, setDoctorApptNotes] = useState('');
  const [apptActionLoading, setApptActionLoading] = useState(false);
  const [apptActionError, setApptActionError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [consentsRes, patientsRes, apptsRes] = await Promise.all([
        consentApi.getDoctorConsents().catch((e) => ({ data: { data: [] } })),
        userApi.getPatients().catch((e) => ({ data: { data: [] } })),
        appointmentApi.getDoctorAppointments().catch((e) => ({ data: { data: [] } })),
      ]);

      if (consentsRes.data?.data) setConsents(consentsRes.data.data);
      if (patientsRes.data?.data) {
        setPatients(patientsRes.data.data);
        if (patientsRes.data.data.length > 0 && !consentForm.patientId) {
          setConsentForm((prev) => ({ ...prev, patientId: patientsRes.data.data[0].id }));
        }
      }
      if (apptsRes.data?.data) setAppointments(apptsRes.data.data);
    } catch (err) {
      console.error('Failed to load doctor dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsent = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await consentApi.create({
        ...consentForm,
        patientId: Number(consentForm.patientId),
        validUntil: consentForm.validUntil || null,
      });
      setCreateModalOpen(false);
      setConsentForm({
        patientId: patients[0]?.id || '',
        procedureName: '',
        procedureDescription: '',
        consentText: '',
        risksAndAlternatives: '',
        validUntil: '',
        doctorNotes: '',
      });
      loadData();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create consent request');
    }
  };

  const handleViewPatientDocs = async (patient) => {
    setSelectedPatient(patient);
    setDocsModalOpen(true);
    try {
      const res = await documentApi.getPatientDocuments(patient.id);
      if (res.data?.data) setPatientDocs(res.data.data);
    } catch (err) {
      console.error('Failed to load patient documents', err);
    }
  };

  const handleDownloadPatientDoc = async (docId, filename) => {
    try {
      const res = await documentApi.download(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  const handleUploadForPatient = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedPatient) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadForm.title);
      formData.append('documentType', uploadForm.documentType);
      formData.append('description', uploadForm.description);
      formData.append('patientId', selectedPatient.id);

      await documentApi.upload(formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadForm({ title: '', documentType: 'LAB_REPORT', description: '' });
      // Refresh patient docs
      handleViewPatientDocs(selectedPatient);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document for patient');
    } finally {
      setUploading(false);
    }
  };

  const openApptActionModal = (appointment, status) => {
    setSelectedAppointment(appointment);
    setTargetApptStatus(status);
    setDoctorApptNotes(appointment.doctorNotes || '');
    setApptActionError('');
    setApptActionModalOpen(true);
  };

  const handleConfirmApptStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    setApptActionLoading(true);
    setApptActionError('');

    try {
      await appointmentApi.updateStatus(selectedAppointment.id, {
        status: targetApptStatus,
        doctorNotes: doctorApptNotes?.trim() || undefined,
      });
      setApptActionModalOpen(false);
      setSelectedAppointment(null);
      loadData();
    } catch (err) {
      setApptActionError(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setApptActionLoading(false);
    }
  };

  const handlePresetAppendectomy = () => {
    setConsentForm({
      patientId: patients[0]?.id || '',
      procedureName: 'Laparoscopic Cholecystectomy',
      procedureDescription: 'Minimally invasive keyhole surgical removal of the gallbladder indicated for symptomatic cholelithiasis (gallstones) and biliary colic.',
      consentText: 'I hereby authorize the surgical team to perform a Laparoscopic Cholecystectomy. The clinical indications, benefits of relieving biliary obstruction, and anticipated postoperative recovery path have been explained in full. I understand that conversion to open laparotomy may occur if severe anatomical inflammation or adhesions are encountered.',
      risksAndAlternatives: 'Identified risks include bile duct injury, hemorrhage, surgical site infection, conversion to open surgery, and general anesthesia complications. Alternative non-surgical watchful waiting and dietary management were reviewed and deemed insufficient.',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      doctorNotes: 'Patient consented after preoperative ultrasound confirmed cholelithiasis. No contraindications detected.',
    });
  };

  if (loading && consents.length === 0 && appointments.length === 0) {
    return <LoadingSpinner size="lg" text="Loading clinical workspace..." />;
  }

  const pendingConsentsCount = consents.filter((c) => c.status === 'PENDING_REVIEW').length;
  const requestedApptsCount = appointments.filter((a) => a.status === 'REQUESTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Physician Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Department: <strong className="text-hospital-700">{user.additionalInfo || 'General Practice'}</strong> &bull; Attending: {user.fullName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold shadow-md shadow-hospital-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Request Procedure Consent</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'consents' })}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'consents'
              ? 'border-hospital-600 text-hospital-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Requested Consents ({consents.length})</span>
          {pendingConsentsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {pendingConsentsCount} pending
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'appointments' })}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'appointments'
              ? 'border-hospital-600 text-hospital-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Appointments ({appointments.length})</span>
          {requestedApptsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {requestedApptsCount} new
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'patients' })}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'patients'
              ? 'border-hospital-600 text-hospital-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Authorized Patients &amp; Records ({patients.length})</span>
        </button>
      </div>

      {/* Consents Tab */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {consents.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No consent requests yet</h3>
              <p className="text-xs text-slate-500 mt-1">Click &quot;Request Procedure Consent&quot; above to initiate a patient consent form.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Consent Number</th>
                    <th className="px-6 py-3.5">Patient</th>
                    <th className="px-6 py-3.5">Proposed Procedure</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5">Date Created</th>
                    <th className="px-6 py-3.5 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {consents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-hospital-700">{c.consentNumber}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{c.patient?.fullName}</span>
                        <span className="text-[10px] text-slate-400 block">{c.patient?.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">{c.procedureName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">{c.procedureDescription}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/consents/${c.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-hospital-50 hover:text-hospital-700 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
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

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical Appointment Schedule</h2>
              <p className="text-xs text-slate-400">Review patient visit requests, confirm scheduled slots, and mark completed consultations</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {appointments.length}</span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No appointments scheduled</h3>
              <p className="text-xs text-slate-500 mt-1">Patient bookings assigned to you will appear here for review and confirmation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Patient Details</th>
                    <th className="px-6 py-3.5">Date &amp; Time</th>
                    <th className="px-6 py-3.5">Reason for Visit</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5">Physician Notes</th>
                    <th className="px-6 py-3.5 text-right">Manage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{a.patientName}</span>
                        <span className="text-[10px] text-slate-400 block">{a.patientEmail} &bull; {a.patientPhone || 'No phone'}</span>
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
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {a.status === 'REQUESTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openApptActionModal(a, 'CONFIRMED')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openApptActionModal(a, 'REJECTED')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openApptActionModal(a, 'COMPLETED')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openApptActionModal(a, 'CANCELLED')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                            >
                              <span>Cancel</span>
                            </button>
                          </>
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

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{p.fullName}</h3>
                <span className="bg-hospital-50 text-hospital-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-hospital-200">
                  {p.bloodGroup || 'Blood: Unknown'}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Email: <strong className="text-slate-700">{p.email}</strong></p>
                <p>DOB: <strong className="text-slate-700">{p.dateOfBirth || 'N/A'}</strong> &bull; Gender: <strong className="text-slate-700">{p.gender}</strong></p>
                <p>Emergency: <strong className="text-slate-700">{p.emergencyContactName || 'N/A'}</strong> ({p.emergencyContactPhone || '—'})</p>
              </div>
              <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleViewPatientDocs(p)}
                  className="flex items-center space-x-1 text-xs font-bold text-hospital-600 hover:text-hospital-800 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Medical Documents</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsentForm((prev) => ({ ...prev, patientId: p.id }));
                    setCreateModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                >
                  Create Consent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Action Modal (Confirm / Reject / Complete / Cancel) */}
      <Modal
        isOpen={apptActionModalOpen}
        onClose={() => setApptActionModalOpen(false)}
        title={`Update Appointment Status: ${targetApptStatus}`}
      >
        <form onSubmit={handleConfirmApptStatusUpdate} className="space-y-4">
          {apptActionError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {apptActionError}
            </div>
          )}

          {selectedAppointment && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Patient: <strong>{selectedAppointment.patientName}</strong></div>
              <div>Scheduled: <strong>{selectedAppointment.appointmentDate} at {selectedAppointment.appointmentTime}</strong></div>
              <div>Reason: <span className="text-slate-600">{selectedAppointment.reason}</span></div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physician Notes / Instructions {targetApptStatus === 'REJECTED' ? '(Reason for rejection)' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={doctorApptNotes}
              onChange={(e) => setDoctorApptNotes(e.target.value)}
              placeholder="e.g. Confirmed. Please bring prior fasting lab reports."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setApptActionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={apptActionLoading}
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs transition ${
                targetApptStatus === 'REJECTED' || targetApptStatus === 'CANCELLED'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-hospital-600 hover:bg-hospital-700'
              }`}
            >
              {apptActionLoading ? 'Saving...' : `Confirm ${targetApptStatus}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Consent Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Digital Procedure Consent" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateConsent} className="space-y-4">
          {createError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {createError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePresetAppendectomy}
              className="text-[11px] font-bold text-hospital-600 hover:text-hospital-800 underline"
            >
              Load Sample Template (Cholecystectomy)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Patient *</label>
            <select
              value={consentForm.patientId}
              onChange={(e) => setConsentForm({ ...consentForm, patientId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.email}) - {p.gender}, DOB: {p.dateOfBirth || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Procedure / Surgical Name *</label>
            <input
              type="text"
              required
              value={consentForm.procedureName}
              onChange={(e) => setConsentForm({ ...consentForm, procedureName: e.target.value })}
              placeholder="e.g. Total Hip Arthroplasty"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Procedure Summary / Description</label>
            <textarea
              rows={2}
              value={consentForm.procedureDescription}
              onChange={(e) => setConsentForm({ ...consentForm, procedureDescription: e.target.value })}
              placeholder="Brief summary of procedure..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Informed Consent Legal Agreement Text *</label>
            <textarea
              rows={4}
              required
              value={consentForm.consentText}
              onChange={(e) => setConsentForm({ ...consentForm, consentText: e.target.value })}
              placeholder="Detailed explanation of clinical steps, patient acknowledgments, and authorizations..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Risks, Known Complications, &amp; Alternatives</label>
            <textarea
              rows={2}
              value={consentForm.risksAndAlternatives}
              onChange={(e) => setConsentForm({ ...consentForm, risksAndAlternatives: e.target.value })}
              placeholder="Specific surgical risks, anesthesia cautions, and non-operative alternatives..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until Date</label>
              <input
                type="date"
                value={consentForm.validUntil}
                onChange={(e) => setConsentForm({ ...consentForm, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attending Physician Pre-Op Notes</label>
              <input
                type="text"
                value={consentForm.doctorNotes}
                onChange={(e) => setConsentForm({ ...consentForm, doctorNotes: e.target.value })}
                placeholder="Diagnostic findings, lab clearance..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Issue Consent to Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Documents View Modal */}
      <Modal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        title={`Medical Records: ${selectedPatient?.fullName || 'Patient'}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-150">
            <div>
              <span className="text-xs text-slate-500">
                Blood Group: <strong>{selectedPatient?.bloodGroup || 'N/A'}</strong> &bull; DOB: {selectedPatient?.dateOfBirth || 'N/A'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Clinical Record</span>
            </button>
          </div>

          {patientDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No medical documents on file for this patient. Click &quot;Upload Clinical Record&quot; to attach lab or imaging reports.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Uploaded By</th>
                    <th className="px-4 py-2.5">Checksum (SHA-256)</th>
                    <th className="px-4 py-2.5 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {patientDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 block">{doc.originalFilename}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{doc.documentType}</td>
                      <td className="px-4 py-3 text-slate-500">{doc.uploaderName}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={doc.checksumSha256}>
                        {doc.checksumSha256.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPatientDoc(doc.id, doc.originalFilename)}
                          className="p-1.5 text-slate-600 hover:text-hospital-600 hover:bg-hospital-50 rounded-lg transition"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Upload Doc for Patient Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={`Upload Clinical Document for ${selectedPatient?.fullName || 'Patient'}`}
      >
        <form onSubmit={handleUploadForPatient} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. Pre-Operative Blood Panel"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Classification *</label>
            <select
              value={uploadForm.documentType}
              onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            >
              <option value="LAB_REPORT">Lab Report</option>
              <option value="IMAGING">Imaging / Radiology</option>
              <option value="SURGICAL_NOTES">Surgical / Clinical Notes</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="GENERAL">General Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File (PDF, PNG, JPG, DOCX, TXT) *</label>
            <input
              type="file"
              required
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-hospital-50 file:text-hospital-700 hover:file:bg-hospital-100"
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
              {uploading ? 'Uploading & Hashing...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
